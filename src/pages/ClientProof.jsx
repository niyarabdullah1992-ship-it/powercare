import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { getCompanyToken } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import PeriodPicker from "@/components/shared/PeriodPicker";
import { usePeriod } from "@/lib/PeriodContext";
import ProofTaskPicker from "@/components/proof/ProofTaskPicker";
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
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState(null);
  const [proofs, setProofs] = useState([]);

  const stationNameOf = (task) => (data?.stations || []).find((station) => station.id === (task.station_id || task.assignment_id))?.name || "—";

  const completedTasks = useMemo(() => {
    const all = data?.targets || [];
    return all.filter((task) => {
      if (task.status !== "completed") return false;
      const when = new Date(task.end_date || task.start_date || task.created_at || Date.now());
      return resolved.valid && when >= resolved.start && when <= resolved.end;
    });
  }, [data?.targets, resolved]);

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
    const items = completedTasks.filter((task) => selectedIds.includes(task.id)).map((task) => proofItemFromTask(task, stationNameOf(task)));
    const payload = {
      clientName: clientName.trim(),
      projectName: projectName.trim(),
      periodStart: resolved.startDate,
      periodEnd: resolved.endDate,
      items,
    };
    setIssuing(true);
    try {
      const contentHash = await proofContentHash(payload);
      const proofId = newProofId();
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
        payload,
      });
      if (res.data?.ok) {
        setIssued({ proofId, contentHash });
        setSelectedIds([]);
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

  const canIssue = clientName.trim() && selectedIds.length > 0 && resolved.valid && !issuing;

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "إثبات العمل للعميل" : "Client work proof"}
        description={ar ? "حوّل الأعمال المكتملة بأدلتها الميدانية إلى تقرير موثّق يُشارَك مع عميلك برابط وبصمة SHA-256." : "Turn completed, evidence-backed work into a verifiable report you share with your client via link and SHA-256 fingerprint."}
        icon={ShieldCheck}
      />

      {issued && <ProofIssuedCard proofId={issued.proofId} contentHash={issued.contentHash} ar={ar} />}

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
        <ProofTaskPicker tasks={completedTasks} selectedIds={selectedIds} onToggle={toggle} stationNameOf={stationNameOf} ar={ar} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground font-body">
            {ar ? `${selectedIds.length} بند مختار — لن تُشارَك أي بيانات تعريفية عن الموظفين.` : `${selectedIds.length} items selected — no employee identifying data is shared.`}
          </p>
          <button type="button" disabled={!canIssue} onClick={issue} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-40">
            {issuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {ar ? "إصدار إثبات ومشاركته" : "Issue & share proof"}
          </button>
        </div>
      </section>

      <IssuedProofList proofs={proofs} onRevoke={revoke} ar={ar} />
    </div>
  );
}