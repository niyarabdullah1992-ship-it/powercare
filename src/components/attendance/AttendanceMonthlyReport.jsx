import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { base44 } from "@/api/base44Client";
import MobileSelect from "@/components/mobile/MobileSelect";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";
import { useI18n } from "@/lib/i18n";
import { formatTime, useTimeFormat } from "@/hooks/useTimeFormat";
import { CalendarRange, FileText } from "lucide-react";

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
  const [open, setOpen] = useState(false);

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
    const selectedEmployees = employeeId === "all" ? employees : employees.filter((employee) => employee.id === employeeId);
    setLoading(true);
    Promise.all(selectedEmployees.map((employee) =>
      base44.functions.invoke("supabaseAttendance", { action: "listRange", employeeId: employee.id, ...dateWindow })
        .then((res) => (res?.data?.rows || []).map((row) => ({ ...row, employeeId: employee.id, employeeName: employee.name })))
    ))
      .then((results) => setRows(results.flat()))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [employeeId, dateWindow.startDate, dateWindow.endDate, employees.map((employee) => employee.id).join(",")]);

  const totals = rows.reduce(
    (acc, r) => {
      if (r.status === "present") acc.present++;
      else if (r.status === "late") acc.late++;
      else if (r.status === "absent" && r.excused) acc.excusedAbsent++;
      else if (r.status === "absent") acc.absent++;
      acc.hours += Number(r.work_hours) || 0;
      return acc;
    },
    { present: 0, late: 0, absent: 0, excusedAbsent: 0, hours: 0 }
  );

  const statusLabel = (r) => t(`attendanceStatus${r.status.charAt(0).toUpperCase()}${r.status.slice(1).replace(/_([a-z])/, (m, c) => c.toUpperCase())}`);

  const allEmployeesSelected = employeeId === "all";
  const allEmployeesLabel = lang === "ar" ? "كل الموظفين" : "All employees";
  const exportHeaders = [...(allEmployeesSelected ? [t("employeeName")] : []), t("date"), t("status"), t("checkIn"), t("checkOut"), t("workHoursLabel"), t("lateMinutesLabel"), lang === "ar" ? "تحضير يدوي" : "Manual attendance"];
  const exportRows = rows.map((r) => [
    ...(allEmployeesSelected ? [r.employeeName || "—"] : []),
    r.date, statusLabel(r) + (r.excused ? ` (${t("excused")})` : ""),
    r.check_in_at ? formatTime(r.check_in_at, format, lang) : "—",
    r.check_out_at ? formatTime(r.check_out_at, format, lang) : "—",
    r.work_hours ?? "—", r.status === "late" ? (r.late_minutes ?? "—") : "—",
    (r.manual_override || r.location_status === "manual") ? `${lang === "ar" ? "يدوي" : "Manual"} — ${r.override_by || r.excused_by_name || "—"}` : "—",
  ]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${open ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
      >
        <FileText className="w-3.5 h-3.5" /> {lang === "ar" ? "تقرير الحضور والانصراف (PDF / Excel)" : "Attendance report (PDF / Excel)"}
      </button>
      {open && <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <CalendarRange className="w-3.5 h-3.5" /> {t("monthlyAttendanceReport")}
      </p>

      <MobileSelect
        value={employeeId}
        onChange={setEmployeeId}
        placeholder={t("employeeName")}
        searchable
        className="w-full sm:w-72"
        options={[{ value: "all", label: lang === "ar" ? "كل الموظفين" : "All employees" }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
      />

      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.val}
            onClick={() => setRange(r.val)}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${range === r.val ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {rangeLabel(r.val)}
          </button>
        ))}
      </div>

      {range === "custom" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <ComparisonExportButtons
          title={`${t("monthlyAttendanceReport")} — ${allEmployeesSelected ? allEmployeesLabel : employees.find((e) => e.id === employeeId)?.name || ""}`}
          headers={exportHeaders}
          rows={exportRows}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
        <div className="p-3 rounded-lg border border-sky-300 bg-sky-50 text-center">
          <p className="text-lg font-semibold text-sky-700">{totals.excusedAbsent}</p>
          <p className="text-[11px] text-sky-700 font-body">{t("totalAbsent")} ({t("excused")})</p>
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
                {allEmployeesSelected && <th className="py-2 pe-3 text-start">{t("employeeName")}</th>}
                <th className="py-2 pe-3 text-start">{t("date")}</th>
                <th className="py-2 pe-3 text-start">{t("status")}</th>
                <th className="py-2 pe-3 text-start">{t("checkIn")}</th>
                <th className="py-2 pe-3 text-start">{t("checkOut")}</th>
                <th className="py-2 pe-3 text-start">{t("workHoursLabel")}</th>
                <th className="py-2 pe-3 text-start">{t("lateMinutesLabel")}</th>
                <th className="py-2 pe-3 text-start">{lang === "ar" ? "التحضير" : "Attendance source"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.employeeId || employeeId}-${r.id}`} className="border-b border-border/60">
                  {allEmployeesSelected && <td data-label={t("employeeName")} className="py-2 pe-3 font-medium">{r.employeeName || "—"}</td>}
                  <td data-label={t("date")} className="py-2 pe-3">{r.date}</td>
                  <td data-label={t("status")} className="py-2 pe-3 text-muted-foreground">
                    {statusLabel(r)}
                    {r.excused && <span className="ms-1.5 text-emerald-700">({t("excused")})</span>}
                  </td>
                  <td data-label={t("checkIn")} className="py-2 pe-3 text-muted-foreground">{r.check_in_at ? formatTime(r.check_in_at, format, lang) : "—"}</td>
                  <td data-label={t("checkOut")} className="py-2 pe-3 text-muted-foreground">{r.check_out_at ? formatTime(r.check_out_at, format, lang) : "—"}</td>
                  <td data-label={t("workHoursLabel")} className="py-2 pe-3 text-muted-foreground">{r.work_hours ?? "—"}</td>
                  <td data-label={t("lateMinutesLabel")} className="py-2 pe-3 text-muted-foreground">{r.status === "late" ? (r.late_minutes ?? "—") : "—"}</td>
                  <td data-label={lang === "ar" ? "التحضير" : "Attendance source"} className="py-2 pe-3 text-muted-foreground">{(r.manual_override || r.location_status === "manual") ? <span className="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700">{lang === "ar" ? "يدوي" : "Manual"} · {r.override_by || r.excused_by_name || "—"}</span> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>}
    </div>
  );
}