import React, { useEffect, useState } from "react";
import { Landmark } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { getRun, monthKey, netOf } from "@/lib/payroll";
import { expensesCall } from "@/lib/expensesApi";
import { inventoryCall } from "@/lib/inventoryApi";
import PageHeader from "@/components/PageHeader";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";
import FinanceKpiCards from "@/components/finance/FinanceKpiCards";
import FinanceBranchTable from "@/components/finance/FinanceBranchTable";
import FinanceMixChart from "@/components/finance/FinanceMixChart";

const inMonth = (value, month) => String(value || "").slice(0, 7) === month;

export default function Finance() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data, session } = useAuth();
  const [month, setMonth] = useState(monthKey());
  const [claims, setClaims] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      expensesCall(session, "list").catch(() => ({ claims: [] })),
      inventoryCall(session, "list").catch(() => ({ movements: [] })),
    ]).then(([expenseState, inventoryState]) => {
      if (!active) return;
      setClaims(expenseState?.claims || []);
      setMovements(inventoryState?.movements || []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [session?.companyId]);

  const stations = data?.stations || [];
  const run = getRun(data, month);

  const payrollByStation = {};
  (run?.items || []).forEach((item) => {
    const key = item.employeeStationId || "";
    payrollByStation[key] = (payrollByStation[key] || 0) + netOf(item);
  });

  const expensesByStation = {};
  claims
    .filter((claim) => claim.status === "finance_approved" && inMonth(claim.expenseDate, month))
    .forEach((claim) => {
      const key = claim.stationId || "";
      expensesByStation[key] = (expensesByStation[key] || 0) + (Number(claim.totalAmount ?? claim.amount) || 0);
    });

  const purchasesByStation = {};
  movements
    .filter((movement) => movement.movementType === "purchase" && inMonth(movement.purchaseDate || movement.created_date, month))
    .forEach((movement) => {
      const key = movement.toLocationId || "";
      purchasesByStation[key] = (purchasesByStation[key] || 0) + (Number(movement.totalCost) || 0);
    });

  const rows = [...stations.map((station) => ({ id: station.id, name: station.name })), { id: "", name: ar ? "غير محدد" : "Unassigned" }]
    .map((branch) => {
      const payroll = payrollByStation[branch.id] || 0;
      const expenses = expensesByStation[branch.id] || 0;
      const purchases = purchasesByStation[branch.id] || 0;
      return { ...branch, payroll, expenses, purchases, total: payroll + expenses + purchases };
    })
    .filter((row) => row.total > 0 || row.id !== "");

  const totalPayroll = rows.reduce((sum, row) => sum + row.payroll, 0);
  const totalExpenses = rows.reduce((sum, row) => sum + row.expenses, 0);
  const totalPurchases = rows.reduce((sum, row) => sum + row.purchases, 0);
  const grandTotal = totalPayroll + totalExpenses + totalPurchases;

  const monthLabel = new Intl.DateTimeFormat(ar ? "ar" : "en", { month: "long", year: "numeric" }).format(new Date(`${month}-01T00:00:00`));

  return (
    <div className="space-y-5">
      <PageHeader
        title={ar ? "اللوحة المالية" : "Finance"}
        description={ar ? `التكلفة التشغيلية الموحّدة لشهر ${monthLabel}` : `Unified operating cost for ${monthLabel}`}
        icon={Landmark}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm" />
            <ComparisonExportButtons
              title={ar ? `اللوحة المالية — ${monthLabel}` : `Finance — ${monthLabel}`}
              headers={[ar ? "الفرع" : "Branch", ar ? "الرواتب" : "Payroll", ar ? "المصروفات" : "Expenses", ar ? "المشتريات" : "Purchases", ar ? "الإجمالي" : "Total"]}
              rows={rows.map((row) => [row.name, row.payroll, row.expenses, row.purchases, row.total])}
            />
          </div>
        }
      />

      <FinanceKpiCards
        lang={lang}
        items={[
          { label: ar ? "مسير الرواتب" : "Payroll", value: totalPayroll, note: `${(run?.items || []).length} ${ar ? "موظف" : "employees"}` },
          { label: ar ? "المصروفات المعتمدة" : "Approved expenses", value: totalExpenses, note: ar ? "بعد اعتماد المالية" : "Finance approved" },
          { label: ar ? "مشتريات المخزون" : "Inventory purchases", value: totalPurchases, note: ar ? "فواتير الشراء" : "Purchase invoices" },
          { label: ar ? "إجمالي التكلفة" : "Total cost", value: grandTotal, note: ar ? "ريال · للفترة المختارة" : "SAR · selected period" },
        ]}
      />

      {loading ? (
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FinanceBranchTable rows={rows} lang={lang} />
          </div>
          <FinanceMixChart
            lang={lang}
            data={[
              { name: ar ? "رواتب" : "Payroll", value: totalPayroll },
              { name: ar ? "مصروفات" : "Expenses", value: totalExpenses },
              { name: ar ? "مشتريات" : "Purchases", value: totalPurchases },
            ]}
          />
        </div>
      )}
    </div>
  );
}