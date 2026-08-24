import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, Download, Loader2, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { expensesCall } from "@/lib/expensesApi";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { isLocalPreviewActive, LOCAL_PREVIEW_COMPANY_ID } from "@/lib/localPreview";
import { localBudgetCall } from "@/lib/localExpensesFallback";
import { monthKey } from "@/lib/payroll";
import {
  deriveAccountingPeriod,
  accountingExportPack,
  toCsv,
} from "@/lib/accountingDerivations";
import { downloadCsv } from "@/lib/icsExport";
import { canAccessPath } from "@/lib/navVisibility";
import PlatformStampShell from "@/components/shared/PlatformStampShell";
import { ChromeBox } from "@/components/shared/IdentityCard";
import { INK, MUTED, SURFACE, BORDER, NAVY, num, ui, tableShell, emptyState, tableHeadRow } from "@/lib/platformStyles";
import { toast } from "@/components/ui/use-toast";

async function loadBudgets(companyId) {
  if (!companyId) return [];
  if (isLocalPreviewActive() || companyId === LOCAL_PREVIEW_COMPANY_ID) {
    const remote = await localBudgetCall(companyId, { action: "list" });
    return remote?.budgets || [];
  }
  try {
    const res = await base44.functions.invoke("budget", {
      action: "list",
      companyId,
      sessionToken: getCompanyToken(companyId),
    });
    const data = res?.data ?? res;
    return data?.budgets || [];
  } catch {
    const remote = await localBudgetCall(companyId, { action: "list" });
    return remote?.budgets || [];
  }
}

function money(value, ar) {
  const n = Number(value) || 0;
  return `${n.toLocaleString(ar ? "ar-SA" : "en-US", { maximumFractionDigits: 2 })} ${ar ? "ر.س" : "SAR"}`;
}

const monthInputStyle = {
  ...ui.btnGhost,
  height: 34,
  paddingInline: 10,
  cursor: "text",
};

export default function Accounting() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { session, data, currentUser, company } = useAuth();
  const [month, setMonth] = useState(monthKey());
  const [claims, setClaims] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const allowed = canAccessPath("/app/accounting", currentUser, data, company);

  useEffect(() => {
    if (!session?.companyId || !allowed) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [expenseState, budgetRows] = await Promise.all([
          expensesCall(session, "list").catch(() => ({ claims: [] })),
          loadBudgets(session.companyId),
        ]);
        if (cancelled) return;
        setClaims(expenseState?.claims || []);
        setBudgets(budgetRows || []);
      } catch (error) {
        if (!cancelled) {
          toast({
            description: error?.message || (ar ? "تعذّر تحميل ملخص المحاسبة" : "Could not load accounting summary"),
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session?.companyId, allowed, ar]);

  const snapshot = useMemo(
    () => deriveAccountingPeriod({
      month,
      claims,
      budgets,
      payrollRuns: data?.payrollRuns || [],
      lang,
    }),
    [month, claims, budgets, data?.payrollRuns, lang],
  );

  const exportPeriod = () => {
    const pack = accountingExportPack(snapshot, lang);
    const body = [
      toCsv(pack.summaryHeaders, pack.summaryRows),
      "",
      toCsv(pack.expenseHeaders, pack.expenseRows),
      "",
      toCsv(pack.payrollHeaders, pack.payrollRows),
    ].join("\r\n");
    downloadCsv(body, `accounting-${snapshot.month}.csv`);
  };

  if (!allowed) {
    return (
      <p style={{ margin: "40px auto", maxWidth: 420, textAlign: "center", color: MUTED, fontSize: 13, lineHeight: 1.7 }}>
        {ar ? "المحاسبة للمالك أو المالية فقط." : "Accounting is limited to the owner or finance."}
      </p>
    );
  }

  const kpis = [
    {
      label: ar ? "مصروف منشور" : "Posted spend",
      value: money(snapshot.expenses.total, ar),
      note: ar ? `${snapshot.expenses.count} مطالبة` : `${snapshot.expenses.count} claims`,
    },
    {
      label: ar ? "متبقي الميزانية" : "Budget remaining",
      value: money(snapshot.budget.remaining, ar),
      note: ar ? `${snapshot.budget.pct || 0}% مستخدم` : `${snapshot.budget.pct || 0}% used`,
    },
    {
      label: ar ? "صافي رواتب معتمد" : "Approved payroll net",
      value: money(snapshot.payroll.netTotal, ar),
      note: snapshot.payroll.posted
        ? (ar ? `${snapshot.payroll.heads} موظف` : `${snapshot.payroll.heads} heads`)
        : (ar ? "لم يُعتمد بعد" : "Not approved yet"),
    },
    {
      label: ar ? "حماية الأجور" : "Wage protection",
      value: snapshot.payroll.wps.label,
      note: snapshot.payroll.wps.deadline
        ? `${ar ? "المهلة" : "Deadline"} ${snapshot.payroll.wps.deadline}`
        : "—",
    },
  ];

  return (
    <PlatformStampShell
      ar={ar}
      title={ar ? "المحاسبة" : "Accounting"}
      hint={ar
        ? "ملخص فترة فقط — لا يُحسب إلا مصروف معتمد/مدفوع ومسير رواتب معتمد. ليس دفتر أستاذ."
        : "Period summary only — posts approved/paid spend and approved payroll. Not a general ledger."}
      meta={(
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={monthInputStyle}
            aria-label={ar ? "شهر المحاسبة" : "Accounting month"}
          />
          <button type="button" onClick={exportPeriod} style={{ ...ui.btnGhost, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Download size={14} />
            {ar ? "تصدير الفترة" : "Export period"}
          </button>
        </div>
      )}
    >
      {loading ? (
        <div style={{ display: "grid", placeItems: "center", minHeight: 180 }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: MUTED }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            {kpis.map((card) => (
              <ChromeBox key={card.label} style={{ padding: 14, background: SURFACE }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: MUTED, fontSize: 11, fontWeight: 600 }}>
                  <Calculator size={14} />
                  {card.label}
                </div>
                <div style={{ ...num(NAVY), fontSize: 18 }}>{card.value}</div>
                <div style={{ marginTop: 4, color: MUTED, fontSize: 11 }}>{card.note}</div>
              </ChromeBox>
            ))}
          </div>

          <ChromeBox style={{ padding: 0, overflow: "hidden" }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              alignItems: "center",
              padding: "14px 16px",
              borderBottom: `1px solid ${BORDER}`,
            }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 650, color: INK }}>
                {ar ? "مصروفات الفترة المعتمدة" : "Posted period expenses"}
              </h2>
              <Link to="/app/expenses" style={{ color: INK, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                {ar ? "فتح المصروفات" : "Open expenses"} <ExternalLink size={12} />
              </Link>
            </div>
            {snapshot.expenses.claims.length === 0 ? (
              <div style={{ ...emptyState, border: "none", borderRadius: 0 }}>
                {ar ? "لا مصروف معتمد أو مدفوع في هذا الشهر." : "No approved or paid spend in this month."}
              </div>
            ) : (
              <div style={{ ...tableShell, border: "none", borderRadius: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={tableHeadRow}>
                      <th style={{ padding: "10px 14px", textAlign: "start", fontWeight: 600, color: MUTED }}>{ar ? "البيان" : "Title"}</th>
                      <th style={{ padding: "10px 14px", textAlign: "start", fontWeight: 600, color: MUTED }}>{ar ? "الفرع" : "Station"}</th>
                      <th style={{ padding: "10px 14px", textAlign: "start", fontWeight: 600, color: MUTED }}>{ar ? "المبلغ" : "Amount"}</th>
                      <th style={{ padding: "10px 14px", textAlign: "start", fontWeight: 600, color: MUTED }}>{ar ? "الحالة" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.expenses.claims.map((claim) => (
                      <tr key={claim.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td style={{ padding: "10px 14px", color: INK }}>{claim.title || claim.category || "—"}</td>
                        <td style={{ padding: "10px 14px", color: MUTED }}>{claim.stationName || claim.stationId || "—"}</td>
                        <td style={{ padding: "10px 14px", color: INK, fontVariantNumeric: "tabular-nums" }}>{money(claim.amount, ar)}</td>
                        <td style={{ padding: "10px 14px", color: MUTED }}>{claim.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChromeBox>

          <ChromeBox style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 650, color: INK }}>
                {ar ? "مسير الرواتب" : "Payroll run"}
              </h2>
              <Link to="/app/payroll" style={{ color: INK, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                {ar ? "فتح الرواتب" : "Open payroll"} <ExternalLink size={12} />
              </Link>
            </div>
            {snapshot.payroll.posted ? (
              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                {[
                  [ar ? "الحالة" : "Status", snapshot.payroll.status],
                  [ar ? "الرؤوس" : "Heads", snapshot.payroll.heads],
                  [ar ? "الصافي" : "Net", money(snapshot.payroll.netTotal, ar)],
                  ["WPS", snapshot.payroll.wps.label],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: SURFACE, borderRadius: 10, padding: "10px 12px", border: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 650, color: INK }}>{value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: MUTED, fontSize: 12, lineHeight: 1.65 }}>
                {snapshot.payroll.draft
                  ? (ar
                    ? `يوجد مسير لـ ${snapshot.month} بحالة «${snapshot.payroll.status}» — لن يُحسب هنا حتى الاعتماد.`
                    : `A run exists for ${snapshot.month} as “${snapshot.payroll.status}” — it posts here only after approval.`)
                  : (ar ? "لا مسير رواتب لهذا الشهر." : "No payroll run for this month.")}
              </p>
            )}
          </ChromeBox>
        </div>
      )}
    </PlatformStampShell>
  );
}
