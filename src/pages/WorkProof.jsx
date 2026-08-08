import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, FileCheck2 } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { workProofCall } from "@/lib/workProofApi";
import PageHeader from "@/components/PageHeader";
import WorkProofStationPicker from "@/components/workproof/WorkProofStationPicker";
import WorkProofForm from "@/components/workproof/WorkProofForm";
import WorkProofCard from "@/components/workproof/WorkProofCard";
import { toast } from "@/components/ui/use-toast";

export default function WorkProof() {
  const { session, data } = useAuth();
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const [proofs, setProofs] = useState([]);
  const [stations, setStations] = useState([]);
  const [stationId, setStationId] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const stationProofs = proofs.filter((proof) => proof.stationId === stationId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "إثبات العمل للعميل" : "Client Work Proof"}
        description={ar ? "اختر المحطة أولاً ثم افتح سجل إثبات العمل الخاص بها." : "Pick a station first, then open its work proof register."}
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

          <WorkProofForm
            stations={[station]}
            ar={ar}
            onSubmit={(payload) => run("create", payload, ar ? "تم إنشاء سجل الإثبات." : "Work proof created.")}
          />

          {stationProofs.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground font-body">
              {ar ? "لا توجد سجلات إثبات عمل في هذه المحطة." : "No work proof records for this station yet."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {stationProofs.map((proof) => (
                <WorkProofCard
                  key={proof.id}
                  proof={proof}
                  stationName={station.name}
                  ar={ar}
                  onClose={(payload) => run("close", { proofId: proof.id, ...payload }, ar ? "تم إغلاق المهمة." : "Job closed.")}
                  onSign={(payload) => run("sign", { proofId: proof.id, ...payload }, ar ? "تم اعتماد الإثبات بتوقيع العميل." : "Proof sealed with the client's signature.")}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}