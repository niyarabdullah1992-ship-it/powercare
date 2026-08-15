import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import {
  checkGenerateReportGate,
  checkCloseTimesheetGate,
  formatMinutes,
} from "@/lib/reportsDerivations";
import { buildLibraryReport, catalogEntry } from "@/lib/reportLibraryExport";
import SectionReportPicker from "@/components/reports/SectionReportPicker";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import { brandReportColor, PDF_THEME } from "@/lib/pdfTheme";
import { fetchAuditLog } from "@/lib/auditLog";
import { toast } from "@/components/ui/use-toast";
import { ACCENT, MUTED, NAVY, OK, emptyState, num, statCard, ui, CARD, SURFACE } from "@/lib/platformStyles";
import { ChromeBox } from "@/components/shared/IdentityCard";
import PlatformStampShell from "@/components/shared/PlatformStampShell";

async function reportsApi(payload) {
  const res = await base44.functions.invoke("reports", payload);
  return res?.data ?? res;
}

const FORMAT_CHIP = {
  PDF: {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 500,
    background: SURFACE,
    color: MUTED,
    border: "1px solid #E2E8F0",
    whiteSpace: "nowrap",
  },
  XLSX: OK,
  CSV: {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 500,
    background: SURFACE,
    color: MUTED,
    border: "1px solid #E2E8F0",
    whiteSpace: "nowrap",
  },
};

export default function ReportLibraryBoard({ lang = "ar", stationScope = "all" }) {
  const ar = lang === "ar";
  const { company, currentUser, data } = useAuth();
  const [cards, setCards] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [period, setPeriod] = useState("2026-08");
  const [busy, setBusy] = useState(false);
  const [gateHint, setGateHint] = useState(null);
  const [sheet, setSheet] = useState(null);
  const employees = (data?.employees || []).filter((e) => {
    if (!e?.id) return false;
    if (!stationScope || stationScope === "all") return true;
    return (e.stationId || e.station_id) === stationScope;
  });
  const [employeeId, setEmployeeId] = useState(() => employees[0]?.id || "");
  const stationLabel = stationScope !== "all"
    ? (data?.stations?.find((s) => s.id === stationScope)?.name || stationScope)
    : null;

  const employeeIdsKey = employees.map((e) => e.id).join("|");
  useEffect(() => {
    if (!employees.length) return;
    if (!employees.some((e) => e.id === employeeId)) {
      setEmployeeId(employees[0].id);
    }
  }, [employeeIdsKey, employeeId]);

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
      let remote = null;
      try {
        remote = await reportsApi({
          action: "generate",
          companyId: company.id,
          reportId,
          period,
        });
      } catch {
        remote = null;
      }
      if (remote?.error) {
        setGateHint(ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.error));
        toast({ title: ar ? remote.reason : remote.reasonEn, variant: "destructive" });
        return;
      }
      if (remote) {
        applyRemote(remote);
        if (remote.analysis) setAnalysis(remote.analysis);
      }
      setGateHint(null);
      const auditLogs = reportId === "audit_trail" ? await fetchAuditLog(company.id) : [];
      const built = buildLibraryReport({
        reportId,
        period,
        data,
        companyId: company.id,
        employees,
        stationScope,
        lang: ar ? "ar" : "en",
        auditLogs,
      });
      const branding = data?.reportBranding || {};
      const color = brandReportColor(branding.color || PDF_THEME.navy);
      const companyName = company?.name || data?.name || "";
      if (built) {
        const format = built.entry?.format || remote?.format;
        if (format === "PDF") {
          printReport({
            title: built.title,
            companyName,
            periodLabel: built.periodLabel,
            dir: ar ? "rtl" : "ltr",
            stats: built.stats,
            logoUrl: branding.logoUrl || "",
            color,
            sections: [{ heading: built.title, headers: built.headers, rows: built.rows }],
          });
        } else {
          exportExcelColored({
            filename: `${built.title}_${period || "report"}`.replace(/\s+/g, "_"),
            title: built.title,
            headers: built.headers,
            rows: built.rows,
            color,
            dir: ar ? "rtl" : "ltr",
            companyName,
            logoUrl: branding.logoUrl || "",
          });
        }
      }
      toast({
        title: ar
          ? `تم تجهيز: ${remote?.titleAr || built?.title || reportId}`
          : `Ready: ${remote?.titleEn || built?.title || reportId}`,
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

  const visibleCards = stationScope === "all"
    ? cards
    : cards.filter((c) => !c.stationId || c.stationId === stationScope || c.companyWide);

  return (
    <PlatformStampShell
      ar={ar}
      title={ar ? "التقارير" : "Reports"}
      hint={ar ? "من الرأس: نوع التقرير، Excel أو PDF، ومن تاريخ إلى تاريخ." : "From the header: report type, Excel or PDF, and a date range."}
      metaBar={<SectionReportPicker lang={lang} />}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>{ar ? "مكتبة التقارير" : "Report library"}</div>
          <div style={{ fontSize: "11px", color: MUTED }}>
            {ar
              ? "أرقام مشتقة من الخادم · البوابات تُسمّي السبب · التقرير اليومي منفصل"
              : "Server-derived figures · gates name their reason · daily board stays separate"}
            {stationLabel ? (ar ? ` · نطاق: ${stationLabel}` : ` · scope: ${stationLabel}`) : ""}
          </div>
          <label style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: MUTED }}>
            <span>{ar ? "الفترة" : "Period"}</span>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ height: "32px", border: "1px solid #E2E8F0", borderRadius: "9px", background: SURFACE, padding: "0 10px", fontSize: "12px", color: NAVY, fontFamily: "inherit" }}
            />
          </label>
        </div>

        {gateHint && (
          <p style={{ fontSize: "12px", color: "#B45309", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "9px", padding: "10px 12px", marginBottom: "10px" }}>
            {gateHint}
          </p>
        )}

        {busy && visibleCards.length === 0 ? (
          <p style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: MUTED }}>
            <Loader2 className="h-4 w-4 animate-spin" /> …
          </p>
        ) : visibleCards.length === 0 ? (
          <div style={emptyState}>{ar ? "لا تقارير بعد." : "No reports yet."}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(238px,1fr))", gap: "12px" }}>
            {visibleCards.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => generate(r.id)}
                style={{
                  background: CARD,
                  border: "1px solid #E2E8F0",
                  borderRadius: "13px",
                  padding: "16px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  textAlign: "start",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ fontSize: "9px", letterSpacing: "0.1em", color: MUTED, fontWeight: 600 }}>
                    {ar ? r.kickerAr : r.kickerEn}
                  </span>
                  <span style={FORMAT_CHIP[r.format] || FORMAT_CHIP.PDF}>{r.format}</span>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: NAVY }}>{ar ? r.titleAr : r.titleEn}</div>
                <div style={{ fontSize: "11px", color: MUTED, lineHeight: 1.6 }}>{ar ? r.descAr : r.descEn}</div>
                <div style={{ fontSize: "11px", color: MUTED, marginTop: "2px" }}>{ar ? r.lastRunLabelAr : r.lastRunLabelEn}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <ChromeBox>
        <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px", color: NAVY }}>{ar ? "التقارير المجدولة" : "Scheduled reports"}</div>
        <div style={{ fontSize: "11px", color: MUTED, marginBottom: "8px" }}>{ar ? "تُرسل تلقائيًا دون تدخل" : "Delivered automatically, no manual step"}</div>
        {scheduled.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 0", borderTop: "1px solid #F1F5F9", flexWrap: "wrap" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: ACCENT, flexShrink: 0 }} />
            <div style={{ flex: "1 1 220px", minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 500, color: NAVY }}>{ar ? s.titleAr : s.titleEn}</div>
              <div style={{ fontSize: "11px", color: MUTED, marginTop: "2px" }}>{ar ? s.recipientsAr : s.recipientsEn}</div>
            </div>
            <span style={{ fontSize: "11px", color: MUTED, whiteSpace: "nowrap" }}>{ar ? s.cadenceAr : s.cadenceEn}</span>
          </div>
        ))}
      </ChromeBox>

      {/* App-only derived analysis — chrome matches L1318 scheduled card */}
      {analysis && (
        <ChromeBox>
          <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY, marginBottom: "12px" }}>
            {ar ? "تحليل الحضور والإضافي (مشتق)" : "Attendance & OT analysis (derived)"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(166px,1fr))", gap: "12px" }}>
            <div style={statCard}>
              <div dir="ltr" style={num(NAVY)}>{analysis.lateEvents}</div>
              <div style={{ fontSize: "11px", color: MUTED, marginTop: "7px", lineHeight: 1.5 }}>
                {ar ? `أحداث تأخر · متوسط ${analysis.avgLateMinutes} د` : `late events · avg ${analysis.avgLateMinutes} min`}
              </div>
            </div>
            <div style={statCard}>
              <div dir="ltr" style={num(NAVY)}>{analysis.repeatAbsence?.length || 0}</div>
              <div style={{ fontSize: "11px", color: MUTED, marginTop: "7px", lineHeight: 1.5 }}>
                {ar ? "غياب متكرر (≥2)" : "repeat absence (≥2)"}
              </div>
            </div>
            <div style={statCard}>
              <div dir="ltr" style={num("#DC2626")}>{analysis.stationsOverCap?.length || 0}</div>
              <div style={{ fontSize: "11px", color: MUTED, marginTop: "7px", lineHeight: 1.5 }}>
                {ar
                  ? `فروع فوق حد الإضافي (${analysis.weeklyOtCapHours}س/رأس/أسبوع)`
                  : `stations over OT cap (${analysis.weeklyOtCapHours}h/head/week)`}
              </div>
            </div>
          </div>
          {analysis.stationsOverCap?.length > 0 && (
            <div style={{ fontSize: "11px", color: "#B91C1C", marginTop: "12px" }}>
              {analysis.stationsOverCap.map((s) => `${s.stationId}: ${s.overtimeHours}h`).join(" · ")}
            </div>
          )}
          {analysis.individualBreaches?.length > 0 && (
            <div style={{ fontSize: "11px", color: "#B45309", marginTop: "8px" }}>
              {ar ? "تجاوز فردي لحد 48س/أسبوع:" : "Individual weekly 48h breaches:"}{" "}
              {analysis.individualBreaches.map((b) => b.employeeId).join(", ")}
            </div>
          )}
        </ChromeBox>
      )}

      {/* App-only timesheet — chrome matches L1318 */}
      <ChromeBox>
        <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY, marginBottom: "2px" }}>
          {ar ? "كشف الحضور الشهري → مسير الرواتب" : "Monthly timesheet → payroll"}
        </div>
        <div style={{ fontSize: "11px", color: MUTED, marginBottom: "12px", lineHeight: 1.6 }}>
          {ar
            ? "سماح 10 دقائق · وردية 8 ساعات · ما زاد إضافي. المستند الذي يُقفل عليه المسير."
            : "10-min grace · 8h shift · overtime beyond. The document payroll closes against."}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: MUTED }}>
            {ar ? "موظف" : "Employee"}
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              style={{
                height: "34px",
                border: "1px solid #E2E8F0",
                borderRadius: "9px",
                background: SURFACE,
                padding: "0 10px",
                fontSize: "12px",
                color: NAVY,
                fontFamily: "inherit",
                outline: "none",
              }}
            >
              {employees.length === 0 ? (
                <option value="">{ar ? "لا موظفين في النطاق" : "No employees in scope"}</option>
              ) : employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </label>
          {sheet?.totals && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "11px", color: MUTED }} dir="ltr">
              <span>{ar ? "عادي" : "Ord"} {sheet.totals.ordinaryLabel}</span>
              <span style={{ color: sheet.totals.overtimeMinutes ? "#B45309" : MUTED, fontWeight: sheet.totals.overtimeMinutes ? 600 : 400 }}>
                {ar ? "إضافي" : "OT"} {sheet.totals.overtimeLabel}
              </span>
              <span>{ar ? "تأخر" : "Late"} {sheet.totals.lateCount}</span>
              <span style={{ color: sheet.totals.openCheckouts ? "#B45309" : MUTED }}>
                {ar ? "بلا انصراف" : "Open"} {sheet.totals.openCheckouts}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          {!sheet?.sheet?.closed ? (
            <button type="button" onClick={closeSheet} disabled={busy} style={{ ...ui.btnPrimary, opacity: busy ? 0.5 : 1 }}>
              {ar ? "أقفل الشهر وأرسله لمسير الرواتب" : "Close the month and send to payroll"}
            </button>
          ) : (
            <>
              <span style={OK}>
                {ar
                  ? `مقفل · ${sheet.sheet.closedBy || "—"} · ${sheet.sheet.payrollRunId || ""}`
                  : `Closed · ${sheet.sheet.closedBy || "—"} · ${sheet.sheet.payrollRunId || ""}`}
              </span>
              <button
                type="button"
                onClick={reopenSheet}
                disabled={busy}
                style={{
                  height: "38px",
                  padding: "0 14px",
                  borderRadius: "9px",
                  border: "1px solid #E2E8F0",
                  background: CARD,
                  color: MUTED,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: busy ? "wait" : "pointer",
                  fontFamily: "inherit",
                  opacity: busy ? 0.5 : 1,
                }}
              >
                {ar ? "فتح مسبَّب" : "Justified reopen"}
              </button>
            </>
          )}
          {sheet?.days?.length > 0 && (
            <span style={{ fontSize: "11px", color: MUTED }} dir="ltr">
              {sheet.days.length} days · OT {formatMinutes(sheet.totals?.overtimeMinutes || 0)}
            </span>
          )}
        </div>
      </ChromeBox>
      </div>
    </PlatformStampShell>
  );
}
