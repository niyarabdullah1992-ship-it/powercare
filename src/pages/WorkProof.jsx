import React, { useEffect, useState } from "react";
import { FileCheck2 } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { workProofCall } from "@/lib/workProofApi";
import PageHeader from "@/components/PageHeader";
import WorkProofForm from "@/components/workproof/WorkProofForm";
import WorkProofCard from "@/components/workproof/WorkProofCard";
import { toast } from "@/components/ui/use-toast";

export default function WorkProof() {
  const { session, data } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [proofs, setProofs] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "إثبات العمل للعميل" : "Client Work Proof"}
        description={ar ? "وثّق العمل المنجز بالصور والتفاصيل ثم اعتمد السجل بتوقيع العميل إلكترونياً." : "Document completed work with photos and details, then seal the record with the client's electronic signature."}
        icon={FileCheck2}
      />
      <WorkProofForm
        stations={stations}
        ar={ar}
        onSubmit={(payload) => run("create", payload, ar ? "تم إنشاء سجل الإثبات." : "Work proof created.")}
      />
      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      ) : proofs.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground font-body">
          {ar ? "لا توجد سجلات إثبات عمل بعد." : "No work proof records yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {proofs.map((proof) => (
            <WorkProofCard
              key={proof.id}
              proof={proof}
              stationName={stations.find((s) => s.stationId === proof.stationId)?.name || (data?.stations || []).find((s) => s.id === proof.stationId)?.name || "—"}
              ar={ar}
              onClose={(payload) => run("close", { proofId: proof.id, ...payload }, ar ? "تم إغلاق المهمة." : "Job closed.")}
              onSign={(payload) => run("sign", { proofId: proof.id, ...payload }, ar ? "تم اعتماد الإثبات بتوقيع العميل." : "Proof sealed with the client's signature.")}
            />
          ))}
        </div>
      )}
    </div>
  );
}