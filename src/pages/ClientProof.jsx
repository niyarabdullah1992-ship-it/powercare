import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { getCompanyToken } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import PeriodPicker from "@/components/shared/PeriodPicker";
import { usePeriod } from "@/lib/PeriodContext";
import usePerformanceTargets from "@/hooks/usePerformanceTargets";
import ProofClientFilter from "@/components/proof/ProofClientFilter";
import ProofStationPicker from "@/components/proof/ProofStationPicker";
import ProofTaskPicker from "@/components/proof/ProofTaskPicker";
import ProofDisclosurePanel from "@/components/proof/ProofDisclosurePanel";
import ProofPreviewCard from "@/components/proof/ProofPreviewCard";
import ProofIssuedCard from "@/components/proof/ProofIssuedCard";
import IssuedProofList from "@/components/proof/IssuedProofList";
import { newProofId, proofItemFromTask, proofContentHash } from "@/lib/clientProof";
import { toast } from "@/components/ui/use-toast";

// "NiroVera Proof" — turns completed, evidence-backed field work into a
// shareable, tamper-evident report for the company's own client.
export default function ClientProof() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const { resolved } = usePeriod();
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [disclosure, setDisclosure] = useState({ photos: true, locationTime: true, safetyApproval: true });
  const [proofId, setProofId] = useState(newProofId);
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [clientFilter, setClientFilter] = useState("all");
  const stations = data?.stations || [];
  const [stationId, setStationId] = useState("");
  const station = stations.find((entry) => entry.id === stationId);

  const stationNameOf = (task) => (data?.stations || []).find((station) => station.id === (task.station_id || task.assignment_id))?.name || "—";

  // Tasks live on the server — the same scope-filtered list the performance pages use.
  const targets = usePerformanceTargets(company, currentUser);

  const periodTasks = useMemo(() => (targets || []).filter((task) => {
    if (task.status !== "completed") return false;
    if (stationId && (task.station_id || task.assignment_id) !== stationId) return false;
    const when = new Date(task.end_date || task.start_date || task.created_at || Date.now());
    return resolved.valid && when >= resolved.start && when <= resolved.end;
  }), [targets, resolved, stationId]);

  // العملاء المكلِّفون المسجّلون على المهام عند إنشائها في قسم المهام.
  const clients = useMemo(() => [...new Set(periodTasks.map((task) => task.clientCompany).filter(Boolean))], [periodTasks]);

  const completedTasks = useMemo(
    () => (clientFilter === "all" ? periodTasks : periodTasks.filter((task) => task.clientCompany === clientFilter)),
    [periodTasks, clientFilter]
  );

  // Only tasks closed with complete field evidence qualify for a client proof.
  const { eligible, excluded } = useMemo(() => {
    const eligible = [];
    const excluded = [];
    completedTasks.forEach((task) => {
      const proof = Array.isArray(task.completion_proof) ? task.completion_proof : [];
      const photos = proof.filter((entry) => entry.url).length;
      // Field evidence is a photo/file OR a written attestation — both are documented proof.
      const attestations = proof.filter((entry) => !entry.url && entry.text).length;
      if (photos + attestations > 0) eligible.push(task);
      else excluded.push({ task, reason: ar ? "أُغلقت بقرار مشرف بلا دليل ميداني" : "closed by a supervisor with no field evidence" });
    });
    return { eligible, excluded };
  }, [completedTasks, ar]);

  const evidenceCount = useMemo(() => eligible
    .filter((task) => selectedIds.includes(task.id))
    .reduce((sum, task) => sum + (Array.isArray(task.completion_proof) ? task.completion_proof.length : 0), 0), [eligible, selectedIds]);

  const loadProofs = () => {
    if (!company) return;
    base44.functions
      .invoke("clientProof", { action: "list", companyId: company.id, sessionToken: getCompanyToken(company.id) })
      .then((res) => setProofs(res.data?.proofs || []))
      .catch(() => setProofs([]));
  };

  useEffect(loadProofs, [company?.id]);

  const toggle = (id) => setSelectedIds((ids) => (ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id]));

  const issue = async () => {
    // Toggled-off fields are stripped before hashing — never sent, not hidden.
    const items = eligible.filter((task) => selectedIds.includes(task.id)).map((task) => {
      const item = proofItemFromTask(task, stationNameOf(task));
      if (!disclosure.photos) item.photoEvidence = null;
      if (!disclosure.safetyApproval) item.attestations = null;
      if (!disclosure.locationTime) { item.verifiedOnSite = null; item.station = ""; }
      return item;
    });
    const payload = {
      clientName: clientName.trim(),
      projectName: projectName.trim(),
      periodStart: resolved.startDate,
      periodEnd: resolved.endDate,
      disclosure,
      items,
    };
    setIssuing(true);
    try {
      const contentHash = await proofContentHash(payload);
      const res = await base44.functions.invoke("clientProof", {
        action: "issue",
        companyId: company.id,
        sessionToken: getCompanyToken(company.id),
        proofId,
        contentHash,
        companyName: company.name,
        clientName: payload.clientName,
        projectName: payload.projectName,
        periodStart: payload.periodStart,
        periodEnd: payload.periodEnd,
        issuedById: currentUser?.id || "",
        issuedByName: currentUser?.name || "",
        stationId,
        stationName: station?.name || "",
        payload,
      });
      if (res.data?.ok) {
        setIssued({ proofId, contentHash });
        setSelectedIds([]);
        setProofId(newProofId());
        loadProofs();
      } else {
        toast({ title: ar ? "تعذّر إصدار الإثبات" : "Could not issue the proof", description: res.data?.error || "" });
      }
    } finally {
      setIssuing(false);
    }
  };

  const revoke = async (proofId) => {
    await base44.functions.invoke("clientProof", { action: "revoke", proofId, companyId: company.id, sessionToken: getCompanyToken(company.id) });
    loadProofs();
  };

  const canIssue = stationId && clientName.trim() && selectedIds.length > 0 && resolved.valid && !issuing;
  const stationProofs = useMemo(() => proofs.filter((proof) => proof.stationId === stationId), [proofs, stationId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "إثبات العمل للعميل" : "Client work proof"}
        description={ar ? "حوّل الأعمال المكتملة بأدلتها الميدانية إلى تقرير موثّق يُشارَك مع عميلك برابط وبصمة SHA-256." : "Turn completed, evidence-backed work into a verifiable report you share with your client via link and SHA-256 fingerprint."}
        icon={ShieldCheck}
      />

      <ProofStationPicker
        stations={stations}
        value={stationId}
        onChange={(id) => { setStationId(id); setSelectedIds([]); setClientFilter("all"); }}
        countFor={(id) => proofs.filter((proof) => proof.stationId === id).length}
        ar={ar}
      />

      {!stationId && <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground font-body">{ar ? "اختر محطة لرفع إثبات عمل جديد ومشاهدة أرشيفها." : "Select a station to issue a new work proof and browse its archive."}</p>}

      {issued && <ProofIssuedCard proofId={issued.proofId} contentHash={issued.contentHash} ar={ar} />}

      {stationId && (<>
      <section className="space-y-4 rounded-xl border border-border bg-card p-4 md:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-muted-foreground font-body">
            {ar ? "اسم العميل / الجهة" : "Client / authority"}
            <input value={clientName} onChange={(event) => setClientName(event.target.value)} className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm text-foreground" />
          </label>
          <label className="text-xs text-muted-foreground font-body">
            {ar ? "اسم المشروع / العقد" : "Project / contract"}
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm text-foreground" />
          </label>
        </div>
        <PeriodPicker showDaily showWeekly />
        <ProofClientFilter
          clients={clients}
          value={clientFilter}
          onChange={(next) => {
            setClientFilter(next);
            setSelectedIds([]);
            if (next !== "all") {
              setClientName(next);
              const project = periodTasks.find((task) => task.clientCompany === next)?.clientProject;
              if (project) setProjectName(project);
            }
          }}
          ar={ar}
        />
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-body">
          <span>{ar ? `${selectedIds.length} من ${eligible.length} مهام مختارة` : `${selectedIds.length} of ${eligible.length} tasks selected`}</span>
          <span className="h-3 w-px bg-border" />
          <span>{ar ? `${evidenceCount} قطعة إثبات` : `${evidenceCount} evidence pieces`}</span>
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {targets === null
          ? <div className="flex items-center justify-center rounded-xl border border-border bg-card p-10"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>
          : <ProofTaskPicker eligible={eligible} excluded={excluded} selectedIds={selectedIds} onToggle={toggle} stationNameOf={stationNameOf} ar={ar} />}
        <div className="space-y-4">
          <ProofDisclosurePanel value={disclosure} onChange={setDisclosure} ar={ar} />
          <ProofPreviewCard taskCount={selectedIds.length} evidenceCount={evidenceCount} proofId={proofId} canIssue={canIssue} issuing={issuing} onIssue={issue} ar={ar} />
        </div>
      </div>

      <IssuedProofList proofs={stationProofs} onRevoke={revoke} ar={ar} />
      </>)}
    </div>
  );
}