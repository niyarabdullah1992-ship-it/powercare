import React, { useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { expensesCall } from "@/lib/expensesApi";
import PageHeader from "@/components/PageHeader";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import ExpenseStats from "@/components/expenses/ExpenseStats";
import ExpenseList from "@/components/expenses/ExpenseList";
import ExpenseExportButtons from "@/components/expenses/ExpenseExportButtons";
import { toast } from "@/components/ui/use-toast";

const empty = { claims: [], stations: [], canManagerReview: false, canFinanceReview: false, canPickStations: false };

export default function Expenses() {
  const { session, currentUser, data } = useAuth(); const { lang } = useI18n(); const ar = lang === "ar";
  const [state, setState] = useState(empty); const [loading, setLoading] = useState(true);
  const canonicalStations = (data?.stations || []).map((station) => ({ ...station, stationId: station.id }));
  const stationVersion = canonicalStations.map((station) => station.stationId).sort().join("|");
  const load = async () => {
    setLoading(true);
    try {
      const next = await expensesCall(session, "list", { stations: data?.stations || [] });
      const allowedIds = new Set(next.stations.map((station) => station.stationId));
      setState({ ...next, stations: canonicalStations.filter((station) => allowedIds.has(station.stationId)) });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [session?.companyId, stationVersion]);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("powercare:section-analytics", { detail: { path: "/app/expenses", data: state } }));
  }, [state]);
  const run = async (action, payload) => { try { await expensesCall(session, action, payload); await load(); toast({ description: ar ? "تم حفظ العملية." : "Expense updated." }); return true; } catch (error) { toast({ description: error?.response?.data?.error || error.message, variant: "destructive" }); return false; } };
  const submit = async ({ receipt, ...payload }) => { try { const { file_url } = await base44.integrations.Core.UploadFile({ file: receipt }); return await run("submit", { ...payload, receiptUrl: file_url, stationId: currentUser?.stationId }); } catch (error) { toast({ description: error.message, variant: "destructive" }); return false; } };

  return <div className="space-y-6">
    <PageHeader title={ar ? "إدارة المصروفات" : "Expense Management"} description={ar ? "رفع الإيصالات واعتماد المصروفات ومراجعتها ماليًا." : "Submit receipts, approve expenses and complete finance review."} icon={ReceiptText} actions={<ExpenseExportButtons claims={state.claims} stations={state.stations} ar={ar} />} />
    <ExpenseForm stations={state.stations} canPickStations={state.canPickStations} onSubmit={submit} ar={ar} />
    <ExpenseStats claims={state.claims} ar={ar} />
    {loading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : <ExpenseList claims={state.claims} stations={state.stations} canManagerReview={state.canManagerReview} canFinanceReview={state.canFinanceReview} onManagerReview={(claimId, decision) => run("managerReview", { claimId, decision })} onFinanceReview={(claimId, decision) => run("financeReview", { claimId, decision })} ar={ar} />}
  </div>;
}