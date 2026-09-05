import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { expensesCall } from "@/lib/expensesApi";
import { namedServiceReason } from "@/lib/serviceErrors";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import ExpenseStats from "@/components/expenses/ExpenseStats";
import ExpenseList from "@/components/expenses/ExpenseList";
import ExpenseBudgetBoard from "@/components/expenses/ExpenseBudgetBoard";
import { toast } from "@/components/ui/use-toast";
import useStationScope, { matchesStationScope } from "@/hooks/useStationScope";
import PlatformStampShell from "@/components/shared/PlatformStampShell";
import ErpSectionFrame from "@/components/erp/ErpSectionFrame";
import { erpKicker } from "@/lib/erpModuleMeta";
import { ChromeBox } from "@/components/shared/IdentityCard";
import { INK, MUTED, SURFACE, ui } from "@/lib/platformStyles";

const empty = { claims: [], stations: [], canManagerReview: false, canFinanceReview: false, canPickStations: false };

export default function Expenses() {
  const { session, currentUser, data } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const scope = useStationScope();
  const [state, setState] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const canonicalStations = (data?.stations || []).map((station) => ({ ...station, stationId: station.id }));
  const stationVersion = canonicalStations.map((station) => station.stationId).sort().join("|");
  const load = async () => {
    setLoading(true);
    try {
      const next = await expensesCall(session, "list");
      const allowedIds = new Set((next.stations || []).map((station) => station.stationId));
      setState({ ...next, stations: canonicalStations.filter((station) => allowedIds.has(station.stationId)) });
    } catch (error) {
      toast({
        title: ar ? "تعذّر فتح المصروفات" : "Expenses could not be opened",
        description: namedServiceReason(error, ar, {
          ar: "لم تستجب خدمة المصروفات لهذا الحساب — لا تُعرض المطالبات ولا يُقبل اعتماد أو صرف.",
          en: "The expenses service did not respond for this account — no claims are shown and no approval or payment is accepted.",
        }),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [session?.companyId, stationVersion]);
  const run = async (action, payload) => {
    try {
      await expensesCall(session, action, payload);
      await load();
      toast({ description: ar ? "تم حفظ العملية." : "Expense updated." });
      return true;
    } catch (error) {
      toast({ description: error?.response?.data?.error || error.message, variant: "destructive" });
      return false;
    }
  };
  const submit = async (payload) => run("submit", { ...payload, stationId: currentUser?.stationId });

  const scopedClaims = (state.claims || []).filter((c) => matchesStationScope(c.stationId, scope, data?.stations));

  const pendingClaims = scopedClaims.filter((c) => ["submitted", "manager_approved", "pending"].includes(c.status)).length;

  return (
    <PlatformStampShell
      ar={ar}
      kicker={erpKicker("/app/expenses", lang)}
      title={ar ? "المصروفات" : "Expenses"}
      hint={ar ? "مطالبات مقابل ميزانية كل فرع · الإيصال بوابة الاعتماد" : "Claims against each station budget · receipt gates approval"}
      meta={(
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          style={showForm ? ui.btnGhost : ui.btnPrimary}
        >
          {showForm ? (ar ? "إخفاء النموذج" : "Hide form") : (ar ? "مطالبة جديدة" : "New claim")}
        </button>
      )}
    >

      <ErpSectionFrame
        path="/app/expenses"
        ar={ar}
        stats={[
          { label: ar ? "مطالبات" : "Claims", value: scopedClaims.length },
          { label: ar ? "بانتظار الاعتماد" : "Awaiting approval", value: pendingClaims, tone: pendingClaims > 0 ? "warn" : "ok" },
          { label: ar ? "الفروع" : "Stations", value: state.stations?.length || 0 },
        ]}
      >
      <p style={{ margin: 0, fontSize: 12, color: MUTED, lineHeight: 1.65 }}>
          {ar ? (
            <>
              المطالبات المعتمدة تُقابل{" "}
              <Link to="/app/payroll" style={{ fontWeight: 600, color: INK }}>مسير الرواتب</Link>
              {" "}من الحضور المعتمد.
            </>
          ) : (
            <>
              Approved claims sit beside{" "}
              <Link to="/app/payroll" style={{ fontWeight: 600, color: INK }}>Payroll</Link>
              {" "}fed by approved attendance.
            </>
          )}
        </p>

      <ExpenseBudgetBoard lang={lang} stationScope={scope} />

      {showForm && (
        <ExpenseForm stations={state.stations} canPickStations={state.canPickStations} onSubmit={submit} ar={ar} />
      )}

      <ChromeBox>
      <details>
        <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 600, color: INK, listStyle: "none" }}>
          {ar ? "قائمة المطالبات التفصيلية" : "Detailed claims list"}
        </summary>
        <p style={{ margin: "8px 0 14px", fontSize: "11px", color: MUTED }}>
          {ar
            ? "لوحة الميزانية أعلاه هي السطح الأساسي — القائمة أدناه لنفس المطالبات."
            : "The budget board above is primary — the list below is the same claims."}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <ExpenseStats claims={scopedClaims} ar={ar} />
          {loading
            ? <div style={{ height: "160px", borderRadius: "14px", background: SURFACE }} />
            : (
              <ExpenseList
                claims={scopedClaims}
                stations={state.stations}
                canManagerReview={state.canManagerReview}
                canFinanceReview={state.canFinanceReview}
                onManagerReview={(claimId, decision) => run("managerReview", { claimId, decision })}
                onFinanceReview={(claimId, decision) => run("financeReview", { claimId, decision })}
                ar={ar}
              />
            )}
        </div>
      </details>
      </ChromeBox>
      </ErpSectionFrame>
    </PlatformStampShell>
  );
}
