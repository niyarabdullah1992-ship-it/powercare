import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { base44 } from "@/api/base44Client";
import MobileSelect from "@/components/mobile/MobileSelect";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";
import { useI18n } from "@/lib/i18n";
import { formatTime, useTimeFormat } from "@/hooks/useTimeFormat";

const RANGES = [
  { val: "monthly", amount: 1, unit: "months" },
  { val: "3months", amount: 3, unit: "months" },
  { val: "6months", amount: 6, unit: "months" },
  { val: "yearly", amount: 1, unit: "years" },
  { val: "custom" },
];

// Per-employee attendance report with present/late/absent/hours totals, a flexible
// date-range filter (monthly / 3mo / 6mo / yearly / custom), and Excel export.
export default function AttendanceMonthlyReport({ employees, defaultEmployeeId, t }) {
  const { lang } = useI18n();
  const { format } = useTimeFormat();
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId || employees[0]?.id || "");
  const [range, setRange] = useState("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const rangeLabel = (val) => ({
    monthly: t("rangeMonthly"),
    "3months": t("range3Months"),
    "6months": t("preset6Months"),
    yearly: t("rangeYearly"),
    custom: t("rangeCustom"),
  }[val] || val);

  const dateWindow = useMemo(() => {
    let start, end = moment();
    if (range === "custom") {
      start = customStart ? moment(customStart) : moment().subtract(1, "months");
      end = customEnd ? moment(customEnd) : moment();
    } else {
      const cfg = RANGES.find((r) => r.val === range);
      start = moment().subtract(cfg.amount, cfg.unit);
    }
    return { startDate: start.format("YYYY-MM-DD"), endDate: end.format("YYYY-MM-DD") };
  }, [range, customStart, customEnd]);

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    base44.functions.invoke("supabaseAttendance", { action: "listRange", employeeId, ...dateWindow })
      .then((res) => setRows(res?.data?.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [employeeId, dateWindow.startDate, dateWindow.endDate]);

  const totals = rows.reduce(
    (acc, r) => {
      if (r.status === "present") acc.present++;
      else if (r.status === "late") acc.late++;
      else if (r.status === "absent") acc.absent++;
      acc.hours += Number(r.work_hours) || 0;
      return acc;
    },
    { present: 0, late: 0, absent: 0, hours: 0 }
  );

  const statusLabel = (r) => t(`attendanceStatus${r.status.charAt(0).toUpperCase()}${r.status.slice(1).replace(/_([a-z])/, (m, c) => c.toUpperCase())}`);

  const exportHeaders = [t("date"), t("status"), t("checkIn"), t("checkOut"), t("workHoursLabel"), t("lateMinutesLabel")];
  const exportRows = rows.map((r) => [
    r.date, statusLabel(r) + (r.excused ? ` (${t("excused")})` : ""),
    r.check_in_at ? formatTime(r.check_in_at, format, lang) : "—",
    r.check_out_at ? formatTime(r.check_out_at, format, lang) : "—",
    r.work_hours ?? "—", r.status === "late" ? (r.late_minutes ?? "—") : "—",
  ]);

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-4">
      <h3 className="font-heading text-lg font-semibold">{t("monthlyAttendanceReport")}</h3>

      <div className="flex flex-wrap gap-3 items-center">
        <MobileSelect
          value={employeeId}
          onChange={setEmployeeId}
          placeholder={t("employeeName")}
          options={employees.map((e) => ({ value: e.id, label: e.name }))}
        />
        <ComparisonExportButtons
          title={`${t("monthlyAttendanceReport")} — ${employees.find((e) => e.id === employeeId)?.name || ""}`}
          headers={exportHeaders}
          rows={exportRows}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.val}
            onClick={() => setRange(r.val)}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${range === r.val ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {rangeLabel(r.val)}
          </button>
        ))}
        {range === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-2.5 py-1.5 rounded-md border border-input text-xs font-body" />
            <span className="text-muted-foreground text-xs">—</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-2.5 py-1.5 rounded-md border border-input text-xs font-body" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50 text-center">
          <p className="text-lg font-semibold text-emerald-700">{totals.present}</p>
          <p className="text-[11px] text-emerald-700 font-body">{t("totalPresent")}</p>
        </div>
        <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-center">
          <p className="text-lg font-semibold text-amber-700">{totals.late}</p>
          <p className="text-[11px] text-amber-700 font-body">{t("totalLate")}</p>
        </div>
        <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-center">
          <p className="text-lg font-semibold text-red-700">{totals.absent}</p>
          <p className="text-[11px] text-red-700 font-body">{t("totalAbsent")}</p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-muted text-center">
          <p className="text-lg font-semibold">{totals.hours.toFixed(1)}</p>
          <p className="text-[11px] text-muted-foreground font-body">{t("totalWorkHours")}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground font-body">…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{t("noAttendanceRecords")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body mobile-cards">
            <thead>
              <tr className="text-start text-xs text-muted-foreground border-b border-border">
                <th className="py-2 pe-3 text-start">{t("date")}</th>
                <th className="py-2 pe-3 text-start">{t("status")}</th>
                <th className="py-2 pe-3 text-start">{t("checkIn")}</th>
                <th className="py-2 pe-3 text-start">{t("checkOut")}</th>
                <th className="py-2 pe-3 text-start">{t("workHoursLabel")}</th>
                <th className="py-2 pe-3 text-start">{t("lateMinutesLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td data-label={t("date")} className="py-2 pe-3">{r.date}</td>
                  <td data-label={t("status")} className="py-2 pe-3 text-muted-foreground">
                    {statusLabel(r)}
                    {r.excused && <span className="ms-1.5 text-emerald-700">({t("excused")})</span>}
                  </td>
                  <td data-label={t("checkIn")} className="py-2 pe-3 text-muted-foreground">{r.check_in_at ? formatTime(r.check_in_at, format, lang) : "—"}</td>
                  <td data-label={t("checkOut")} className="py-2 pe-3 text-muted-foreground">{r.check_out_at ? formatTime(r.check_out_at, format, lang) : "—"}</td>
                  <td data-label={t("workHoursLabel")} className="py-2 pe-3 text-muted-foreground">{r.work_hours ?? "—"}</td>
                  <td data-label={t("lateMinutesLabel")} className="py-2 pe-3 text-muted-foreground">{r.status === "late" ? (r.late_minutes ?? "—") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}