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
import ProofClientCards from "@/components/proof/ProofClientCards";
import ProofCardsSummary from "@/components/proof/ProofCardsSummary";
import ProofStep from "@/components/proof/ProofStep";
import ProofArchive from "@/components/proof/ProofArchive";
import ProofTaskPicker from "@/components/proof/ProofTaskPicker";
import ProofIssuedCard from "@/components/proof/ProofIssuedCard";
import { newProofId, proofItemFromTask, proofContentHash } from "@/lib/clientProof";
import { loadProofCards, saveProofCards } from "@/lib/proofCardDrafts";
import { toast } from "@/components/ui/use-toast";

// "NiroVera Proof" — turns completed, evidence-backed field work into a
// shareable, tamper-evident report for the company's own client.
export default function ClientProof() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const { resolved } = usePeriod();
  const [selectedIds, setSelectedIds] = useState([]);
  const disclosure = { photos: true, locationTime: true, safetyApproval: true, materials: true };
  const [proofId, setProofId] = useState(newProofId);
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [clientFilter, setClientFilter] = useState("all");
  const [clientCards, setClientCards] = useState([]);
  // اسم العميل والمشروع صارا داخل البطاقة — البطاقة الأولى هي هوية الإثبات.
  const primaryCard = clientCards[0] || {};
  const clientName = primaryCard.clientName || primaryCard.companyName || "";
  const projectName = primaryCard.projectName || "";
  const stations = data?.stations || [];
  const [stationId, setStationId] = useState(() => localStorage.getItem("powercare_proof_station") || "");
  const station = stations.find((entry) => entry.id === stationId);

  // استرجاع مسودة بطاقات المحطة وحفظ أي تغيير عليها.
  useEffect(() => { setClientCards(loadProofCards(company?.id, stationId)); }, [company?.id, stationId]);
  useEffect(() => { saveProofCards(company?.id, stationId, clientCards); }, [company?.id, stationId, clientCards]);

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
      // المواد المصروفة تُرسل فقط عند تشغيل الخيار — وإلا لا تُرسل أصلًا.
      clientCards: clientCards.map(({ materials, ...card }) => (disclosure.materials ? { ...card, materials } : card)),
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
        setClientCards([]);
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

  const canIssue = stationId && clientCards.length > 0 && selectedIds.length > 0 && resolved.valid && !issuing;
  const stationProofs = useMemo(() => proofs.filter((proof) => proof.stationId === stationId), [proofs, stationId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "إثبات العمل للعميل" : "Client work proof"}
        description={ar ? "حوّل الأعمال المكتملة بأدلتها الميدانية إلى تقرير موثّق يُشارَك مع عميلك برابط وبصمة SHA-256." : "Turn completed, evidence-backed work into a verifiable report you share with your client via link and SHA-256 fingerprint."}
        icon={ShieldCheck}
      />

      {issued && <ProofIssuedCard proofId={issued.proofId} contentHash={issued.contentHash} ar={ar} />}

      <ProofStep number="1" title={ar ? "المحطة" : "Station"} hint={ar ? "كل محطة لها أرشيف إثباتات خاص بها." : "Each station keeps its own proof archive."}>
        <ProofStationPicker
          stations={stations}
          value={stationId}
          onChange={(id) => { setStationId(id); localStorage.setItem("powercare_proof_station", id); setSelectedIds([]); setClientFilter("all"); }}
          countFor={(id) => proofs.filter((proof) => proof.stationId === id).length}
          ar={ar}
        />
        {!stationId && (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground font-body">
            {ar ? "اختر محطة لإصدار إثبات عمل جديد ومشاهدة أرشيفها." : "Select a station to issue a new work proof and browse its archive."}
          </p>
        )}
      </ProofStep>

      {stationId && (
        <>
          <ProofStep number="2" title={ar ? "بيانات العميل والفترة" : "Client details & period"} hint={ar ? "اسم العميل والعقد ثم الفترة الزمنية للأعمال." : "Client and contract, then the work period."}>
            <div className="space-y-4 rounded-xl border border-border bg-card p-4 md:p-5">
              <PeriodPicker showDaily showWeekly />
              <ProofClientFilter
                clients={clients}
                value={clientFilter}
                onChange={(next) => { setClientFilter(next); setSelectedIds([]); }}
                ar={ar}
              />
            </div>
            <ProofClientCards
              cards={clientCards}
              onChange={setClientCards}
              employees={data?.employees || []}
              signerName={currentUser?.name}
              ar={ar}
            />
          </ProofStep>

          <ProofStep
            number="3"
            title={ar ? "اختيار الأعمال وإصدار الإثبات" : "Select work & issue the proof"}
            hint={ar
              ? `${selectedIds.length} من ${eligible.length} مهمة · ${evidenceCount} قطعة إثبات`
              : `${selectedIds.length} of ${eligible.length} tasks · ${evidenceCount} evidence pieces`}
          >
            <div className="space-y-4">
              <ProofCardsSummary cards={clientCards} ar={ar} />
              {targets === null
                ? <div className="flex items-center justify-center rounded-xl border border-border bg-card p-10"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>
                : <ProofTaskPicker eligible={eligible} excluded={excluded} selectedIds={selectedIds} onToggle={toggle} stationNameOf={stationNameOf} ar={ar} />}
              <button
                type="button"
                onClick={issue}
                disabled={!canIssue}
                className="w-full rounded-md bg-primary px-4 py-3 text-sm font-body text-primary-foreground hover:bg-accent disabled:opacity-50"
              >
                {issuing ? (ar ? "جارٍ الإصدار…" : "Issuing…") : (ar ? "توقيع وإصدار الرابط" : "Sign & issue the link")}
              </button>
            </div>
          </ProofStep>

          <ProofStep number="4" title={ar ? "أرشيف المحطة" : "Station archive"} hint={station?.name || ""}>
            {stationProofs.length === 0
              ? <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground font-body">{ar ? "لا توجد إثباتات صادرة لهذه المحطة بعد." : "No proofs issued for this station yet."}</p>
              : <ProofArchive proofs={stationProofs} onRevoke={revoke} ar={ar} />}
          </ProofStep>
        </>
      )}
    </div>
  );
}