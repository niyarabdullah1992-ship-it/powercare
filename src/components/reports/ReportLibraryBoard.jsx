import React, { useEffect, useState } from "react";
import { BarChart3, Loader2, CalendarClock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import {
  checkGenerateReportGate,
  checkCloseTimesheetGate,
  formatMinutes,
} from "@/lib/reportsDerivations";
import { toast } from "@/components/ui/use-toast";

async function reportsApi(payload) {
  const res = await base44.functions.invoke("reports", payload);
  return res?.data ?? res;
}

const FORMAT_CHIP = {
  PDF: "border-border bg-muted text-muted-foreground",
  XLSX: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CSV: "border-border bg-muted text-muted-foreground",
};

export default function ReportLibraryBoard({ lang = "ar" }) {
  const ar = lang === "ar";
  const { company, currentUser } = useAuth();
  const [cards, setCards] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [period, setPeriod] = useState("2026-08");
  const [busy, setBusy] = useState(false);
  const [gateHint, setGateHint] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [employeeId, setEmployeeId] = useState("e_sa");

  const actor = currentUser
    ? {
      role: currentUser.role,
      owner: currentUser.role === "owner",
      admin: currentUser.role === "admin",
    }
    : null;

  const applyRemote = (remote) => {
    if (Array.isArray(remote?.reportCards)) setCards(remote.reportCards);
    if (Array.isArray(remote?.scheduled)) setScheduled(remote.scheduled);
    if (remote?.analysis) setAnalysis(remote.analysis);
  };

  const load = async () => {
    if (!company?.id) return;
    setBusy(true);
    try {
      let remote = await reportsApi({ action: "list", companyId: company.id });
      if (Array.isArray(remote?.reportCards)
        && remote.reportCards.every((c) => !c.lastRunAt)
        && (!remote.analysis || (remote.analysis.lateEvents === 0 && !remote.analysis.stationsOverCap?.length))) {
        remote = await reportsApi({ action: "seedDemo", companyId: company.id });
      }
      applyRemote(remote);
      setGateHint(null);
    } catch {
      setCards([]);
      setScheduled([]);
    } finally {
      setBusy(false);
    }
  };

  const loadSheet = async () => {
    if (!company?.id || !employeeId) return;
    try {
      const remote = await reportsApi({
        action: "timesheet",
        companyId: company.id,
        employeeId,
        period,
      });
      setSheet(remote);
    } catch {
      setSheet(null);
    }
  };

  useEffect(() => { load(); }, [company?.id]);
  useEffect(() => { loadSheet(); }, [company?.id, employeeId, period]);

  const generate = async (reportId) => {
    const preview = checkGenerateReportGate({ reportId, period, actor });
    if (!preview.ok) {
      setGateHint(ar ? preview.reason : preview.reasonEn);
      toast({ title: ar ? preview.reason : preview.reasonEn, variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const remote = await reportsApi({
        action: "generate",
        companyId: company.id,
        reportId,
        period,
      });
      if (remote?.error) {
        setGateHint(ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.error));
        toast({ title: ar ? remote.reason : remote.reasonEn, variant: "destructive" });
        return;
      }
      applyRemote(remote);
      if (remote?.analysis) setAnalysis(remote.analysis);
      setGateHint(null);
      toast({
        title: ar
          ? `جارٍ تجهيز: ${remote.titleAr || reportId}`
          : `Generating: ${remote.titleEn || reportId}`,
      });
    } catch (e) {
      toast({ title: String(e?.message || e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const closeSheet = async () => {
    const open = sheet?.totals?.openCheckouts || 0;
    const preview = checkCloseTimesheetGate({
      sheet: sheet?.sheet,
      employeeId,
      period,
      openCheckouts: open,
    });
    if (!preview.ok) {
      setGateHint(ar ? preview.reason : preview.reasonEn);
      toast({ title: ar ? preview.reason : preview.reasonEn, variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const remote = await reportsApi({
        action: "closeTimesheet",
        companyId: company.id,
        employeeId,
        period,
      });
      if (remote?.error) {
        setGateHint(ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.error));
        toast({ title: ar ? remote.reason : remote.reasonEn, variant: "destructive" });
        return;
      }
      setGateHint(null);
      toast({ title: ar ? remote.messageAr : remote.messageEn });
      await loadSheet();
    } catch (e) {
      toast({ title: String(e?.message || e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const reopenSheet = async () => {
    const reason = window.prompt(
      ar ? "سبب فتح الكشف (يُقيَّد في التدقيق):" : "Reopen reason (written to audit):",
    );
    setBusy(true);
    try {
      const remote = await reportsApi({
        action: "reopenTimesheet",
        companyId: company.id,
        employeeId,
        period,
        reason,
      });
      if (remote?.error) {
        setGateHint(ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.error));
        toast({ title: ar ? remote.reason : remote.reasonEn, variant: "destructive" });
        return;
      }
      setGateHint(null);
      await loadSheet();
    } catch (e) {
      toast({ title: String(e?.message || e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {ar ? "مكتبة التقارير والتحليلات" : "Report library & analytics"}
          </h2>
          <p className="text-xs text-muted-foreground font-body mt-1">
            {ar
              ? "أرقام مشتقة من الخادم · البوابات تُسمّي السبب · التقرير اليومي للمحطات أعلاه منفصل"
              : "Server-derived figures · gates name their reason · station daily board above stays separate"}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-body text-muted-foreground">
          <span>{ar ? "الفترة" : "Period"}</span>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
          />
        </label>
      </div>

      {gateHint && (
        <p className="text-xs font-body text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {gateHint}
        </p>
      )}

      {busy && cards.length === 0 ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> …
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => generate(r.id)}
              className="text-start rounded-xl border border-border bg-card p-4 space-y-2 hover:border-emerald-500/60 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold">
                  {ar ? r.kickerAr : r.kickerEn}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${FORMAT_CHIP[r.format] || FORMAT_CHIP.PDF}`}>
                  {r.format}
                </span>
              </div>
              <div className="text-sm font-semibold font-body">{ar ? r.titleAr : r.titleEn}</div>
              <p className="text-xs text-muted-foreground font-body leading-relaxed">
                {ar ? r.descAr : r.descEn}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {ar ? r.lastRunLabelAr : r.lastRunLabelEn}
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CalendarClock className="w-4 h-4" />
          {ar ? "التقارير المجدولة" : "Scheduled reports"}
        </div>
        <p className="text-xs text-muted-foreground">
          {ar ? "تُرسل تلقائيًا دون تدخل" : "Delivered automatically, no manual step"}
        </p>
        <ul className="divide-y divide-border/60">
          {scheduled.map((s) => (
            <li key={s.id} className="py-2.5 flex flex-wrap items-center gap-2 justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium">{ar ? s.titleAr : s.titleEn}</div>
                <div className="text-xs text-muted-foreground">{ar ? s.recipientsAr : s.recipientsEn}</div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {ar ? s.cadenceAr : s.cadenceEn}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {analysis && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="text-sm font-semibold">
            {ar ? "تحليل الحضور والإضافي (مشتق)" : "Attendance & OT analysis (derived)"}
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-2xl font-heading font-semibold" dir="ltr">{analysis.lateEvents}</div>
              <div className="text-xs text-muted-foreground">
                {ar ? `أحداث تأخر · متوسط ${analysis.avgLateMinutes} د` : `late events · avg ${analysis.avgLateMinutes} min`}
              </div>
            </div>
            <div>
              <div className="text-2xl font-heading font-semibold" dir="ltr">
                {analysis.repeatAbsence?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                {ar ? "غياب متكرر (≥2)" : "repeat absence (≥2)"}
              </div>
            </div>
            <div>
              <div className="text-2xl font-heading font-semibold text-red-600" dir="ltr">
                {analysis.stationsOverCap?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                {ar
                  ? `محطات فوق حد الإضافي (${analysis.weeklyOtCapHours}س/رأس/أسبوع)`
                  : `stations over OT cap (${analysis.weeklyOtCapHours}h/head/week)`}
              </div>
            </div>
          </div>
          {analysis.stationsOverCap?.length > 0 && (
            <p className="text-xs text-red-700 font-body">
              {analysis.stationsOverCap.map((s) => `${s.stationId}: ${s.overtimeHours}h`).join(" · ")}
            </p>
          )}
          {analysis.individualBreaches?.length > 0 && (
            <p className="text-xs text-amber-800 font-body">
              {ar ? "تجاوز فردي لحد 48س/أسبوع:" : "Individual weekly 48h breaches:"}{" "}
              {analysis.individualBreaches.map((b) => b.employeeId).join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="text-sm font-semibold">
          {ar ? "كشف الحضور الشهري → مسير الرواتب" : "Monthly timesheet → payroll"}
        </div>
        <p className="text-xs text-muted-foreground font-body">
          {ar
            ? "سماح 10 دقائق · وردية 8 ساعات · ما زاد إضافي. المستند الذي يُقفل عليه المسير."
            : "10-min grace · 8h shift · overtime beyond. The document payroll closes against."}
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5">
            {ar ? "موظف" : "Employee"}
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-sm"
            >
              <option value="e_sa">سعود الحربي</option>
              <option value="e_as">عبدالله الشمري</option>
            </select>
          </label>
          {sheet?.totals && (
            <div className="flex flex-wrap gap-3 text-xs font-body" dir="ltr">
              <span>{ar ? "عادي" : "Ord"} {sheet.totals.ordinaryLabel}</span>
              <span className={sheet.totals.overtimeMinutes ? "text-amber-700 font-semibold" : ""}>
                {ar ? "إضافي" : "OT"} {sheet.totals.overtimeLabel}
              </span>
              <span>{ar ? "تأخر" : "Late"} {sheet.totals.lateCount}</span>
              <span className={sheet.totals.openCheckouts ? "text-amber-700" : ""}>
                {ar ? "بلا انصراف" : "Open"} {sheet.totals.openCheckouts}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!sheet?.sheet?.closed ? (
            <button
              type="button"
              onClick={closeSheet}
              disabled={busy}
              className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50"
            >
              {ar ? "أقفل الشهر وأرسله لمسير الرواتب" : "Close the month and send to payroll"}
            </button>
          ) : (
            <>
              <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {ar
                  ? `مقفل · ${sheet.sheet.closedBy || "—"} · ${sheet.sheet.payrollRunId || ""}`
                  : `Closed · ${sheet.sheet.closedBy || "—"} · ${sheet.sheet.payrollRunId || ""}`}
              </span>
              <button
                type="button"
                onClick={reopenSheet}
                disabled={busy}
                className="h-9 px-4 rounded-lg border border-border text-xs font-semibold disabled:opacity-50"
              >
                {ar ? "فتح مسبَّب" : "Justified reopen"}
              </button>
            </>
          )}
          {sheet?.days?.length > 0 && (
            <span className="text-xs text-muted-foreground self-center" dir="ltr">
              {sheet.days.length} days · OT {formatMinutes(sheet.totals?.overtimeMinutes || 0)}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
