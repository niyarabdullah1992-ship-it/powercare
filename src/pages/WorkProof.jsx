import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, FileCheck2, X } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { workProofCall } from "@/lib/workProofApi";
import PageHeader from "@/components/PageHeader";
import WorkProofStationPicker from "@/components/workproof/WorkProofStationPicker";
import WorkProofForm from "@/components/workproof/WorkProofForm";
import WorkProofCard from "@/components/workproof/WorkProofCard";
import ProofRegisterToolbar from "@/components/workproof/ProofRegisterToolbar";
import { toast } from "@/components/ui/use-toast";

export default function WorkProof() {
  const { session, data } = useAuth();
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const [proofs, setProofs] = useState([]);
  const [stations, setStations] = useState([]);
  const [stationId, setStationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  const load = async () => {
    setLoading(true);
    try {
      const res = await workProofCall(session, "list");
      const names = new Map((data?.stations || []).map((s) => [s.id, s.name]));
      setProofs(res.proofs || []);
      setStations((res.stations || []).map((s) => ({ ...s, name: names.get(s.stationId) || s.name })));
    } catch (error) {
      toast({ description: error?.response?.data?.error || error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [session?.companyId]);

  const run = async (action, payload, successMsg) => {
    try {
      await workProofCall(session, action, payload);
      await load();
      toast({ description: successMsg });
      return true;
    } catch (error) {
      toast({ description: error?.response?.data?.error || error.message, variant: "destructive" });
      return false;
    }
  };

  const counts = stations.reduce((acc, station) => {
    const list = proofs.filter((proof) => proof.stationId === station.stationId);
    acc[station.stationId] = { total: list.length, open: list.filter((proof) => proof.status === "in_progress").length };
    return acc;
  }, {});
  const station = stations.find((s) => s.stationId === stationId);
  const stationProofs = useMemo(() => proofs.filter((proof) => proof.stationId === stationId), [proofs, stationId]);

  const statusCounts = stationProofs.reduce((acc, proof) => {
    acc[proof.status] = (acc[proof.status] || 0) + 1;
    return acc;
  }, { all: stationProofs.length });

  // Search covers what the field actually asks about: who was on site and which vehicle entered.
  const visibleProofs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stationProofs.filter((proof) => {
      if (status !== "all" && proof.status !== status) return false;
      if (!q) return true;
      const haystack = [
        proof.workTitle, proof.proofNumber, proof.workDescription, proof.performedByName,
        ...(proof.workers || []).flatMap((w) => [w.name, w.idNumber, w.phone]),
        ...(proof.vehicles || []).flatMap((v) => [v.plate, v.make, v.model, v.driverName]),
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [stationProofs, query, status]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "إثبات العمل للعميل" : "Client Work Proof"}
        description={ar ? "سجل المحطة — ابحث فيه، ثم افتح مهمة جديدة عند الحاجة." : "The station register — search it, then open a new job when needed."}
        icon={FileCheck2}
      />

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      ) : !station ? (
        <WorkProofStationPicker stations={stations} counts={counts} ar={ar} onSelect={setStationId} />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setStationId(null)} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-body hover:bg-muted">
              <BackArrow className="h-3.5 w-3.5" />{ar ? "كل المحطات" : "All stations"}
            </button>
            <h2 className="font-heading text-xl font-semibold">{station.name}</h2>
          </div>

          <ProofRegisterToolbar
            ar={ar}
            query={query}
            onQuery={setQuery}
            status={status}
            onStatus={setStatus}
            counts={statusCounts}
            total={visibleProofs.length}
            onNew={() => setFormOpen(true)}
          />

          {visibleProofs.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground font-body">
              {ar ? "لا توجد سجلات مطابقة في هذه المحطة." : "No matching records in this station."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visibleProofs.map((proof) => (
                <WorkProofCard
                  key={proof.id}
                  proof={proof}
                  stationName={station.name}
                  ar={ar}
                  onClose={(payload) => run("close", { proofId: proof.id, ...payload }, ar ? "تم إغلاق المهمة." : "Job closed.")}
                  onSign={(payload) => run("sign", { proofId: proof.id, ...payload }, ar ? "تم اعتماد الإثبات بتوقيع العميل." : "Proof sealed with the client's signature.")}
                  onSendLink={(payload) => run("sendSignLink", { proofId: proof.id, ...payload }, ar ? "تم إرسال رابط التوقيع للعميل." : "Signature link emailed to the client.")}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {formOpen && station && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6" onClick={() => setFormOpen(false)}>
          <div className="relative max-h-full w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setFormOpen(false)} className="absolute end-3 top-3 z-10 rounded-md bg-card/90 p-1.5 text-muted-foreground hover:bg-muted" aria-label="close">
              <X className="h-4 w-4" />
            </button>
            <WorkProofForm
              stations={[station]}
              ar={ar}
              onSubmit={async (payload) => {
                const ok = await run("create", payload, ar ? "تم إنشاء سجل الإثبات." : "Work proof created.");
                if (ok) setFormOpen(false);
                return ok;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}