import React, { useEffect, useState } from "react";
import { ReceiptText, FileText } from "lucide-react";
import SectionToolbar from "@/components/shared/SectionToolbar";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { expensesCall } from "@/lib/expensesApi";
import PageHeader from "@/components/PageHeader";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import ExpenseStats from "@/components/expenses/ExpenseStats";
import ExpenseList from "@/components/expenses/ExpenseList";
import ExpenseReportPanel from "@/components/expenses/ExpenseReportPanel";
import ExpenseBudgetBoard from "@/components/expenses/ExpenseBudgetBoard";
import { toast } from "@/components/ui/use-toast";

const empty = { claims: [], stations: [], canManagerReview: false, canFinanceReview: false, canPickStations: false };

export default function Expenses() {
  const { session, currentUser, data } = useAuth(); const { lang } = useI18n(); const ar = lang === "ar";
  const [state, setState] = useState(empty); const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const canonicalStations = (data?.stations || []).map((station) => ({ ...station, stationId: station.id }));
  const stationVersion = canonicalStations.map((station) => station.stationId).sort().join("|");
  const load = async () => {
    setLoading(true);
    try {
      const next = await expensesCall(session, "list");
      const allowedIds = new Set((next.stations || []).map((station) => station.stationId));
      setState({ ...next, stations: canonicalStations.filter((station) => allowedIds.has(station.stationId)) });
    } catch (error) {
      toast({ description: error?.response?.data?.error || error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [session?.companyId, stationVersion]);
  const run = async (action, payload) => { try { await expensesCall(session, action, payload); await load(); toast({ description: ar ? "تم حفظ العملية." : "Expense updated." }); return true; } catch (error) { toast({ description: error?.response?.data?.error || error.message, variant: "destructive" }); return false; } };
  const submit = async (payload) => run("submit", { ...payload, stationId: currentUser?.stationId });

  return <div className="space-y-6">
    <PageHeader title={ar ? "إدارة المصروفات" : "Expense Management"} description={ar ? "رفع الإيصالات واعتماد المصروفات ومراجعتها ماليًا." : "Submit receipts, approve expenses and complete finance review."} icon={ReceiptText} />
    <ExpenseBudgetBoard lang={lang} />
    <ExpenseForm stations={state.stations} canPickStations={state.canPickStations} onSubmit={submit} ar={ar} />
    <ExpenseStats claims={state.claims} ar={ar} />
    <SectionToolbar
      actions={[{ key: "report", icon: FileText, label: ar ? "تقرير المصروفات (PDF / Excel)" : "Expense report (PDF / Excel)", active: showReport, onClick: () => setShowReport(!showReport) }]}
    />
    {showReport && <ExpenseReportPanel claims={state.claims} stations={state.stations} ar={ar} />}
    {loading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : <ExpenseList claims={state.claims} stations={state.stations} canManagerReview={state.canManagerReview} canFinanceReview={state.canFinanceReview} onManagerReview={(claimId, decision) => run("managerReview", { claimId, decision })} onFinanceReview={(claimId, decision) => run("financeReview", { claimId, decision })} ar={ar} />}
  </div>;
}