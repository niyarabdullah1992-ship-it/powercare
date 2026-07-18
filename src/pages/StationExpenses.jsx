import React, { useEffect, useState } from "react";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { expensesCall } from "@/lib/expensesApi";
import PageHeader from "@/components/PageHeader";
import ExpenseStats from "@/components/expenses/ExpenseStats";
import ExpenseList from "@/components/expenses/ExpenseList";
import ExpenseExportButtons from "@/components/expenses/ExpenseExportButtons";

export default function StationExpenses() {
  const { stationId } = useParams();
  const { session, data } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const station = data?.stations?.find((item) => item.id === stationId);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    expensesCall(session, "list").then((result) => {
      setClaims(result.claims.filter((claim) => (claim.stationIds?.length ? claim.stationIds : [claim.stationId]).includes(stationId)));
    }).finally(() => setLoading(false));
  }, [session?.token, stationId]);
  if (!station) return <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">{ar ? "المحطة غير موجودة." : "Station not found."}</div>;
  const stations = data.stations.map((item) => ({ ...item, stationId: item.id }));
  return <div className="space-y-6">
    <Link to="/app/stations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{ar ? "العودة إلى المحطات" : "Back to stations"}</Link>
    <PageHeader title={ar ? `مصروفات ${station.name}` : `${station.name} Expenses`} description={ar ? "السجل المالي الخاص بهذه المحطة فقط." : "Financial expense ledger for this station only."} icon={ReceiptText} actions={<ExpenseExportButtons claims={claims} stations={stations} ar={ar} title={ar ? `تقرير مصروفات ${station.name}` : `${station.name} Expense Report`} />} />
    <ExpenseStats claims={claims} ar={ar} />
    {loading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : <ExpenseList claims={claims} stations={stations} canManagerReview={false} canFinanceReview={false} ar={ar} />}
  </div>;
}