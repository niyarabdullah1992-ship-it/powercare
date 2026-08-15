import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { base44 } from "@/api/base44Client";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";
import { useI18n } from "@/lib/i18n";
import { deriveTeamAttendanceToday } from "@/lib/attendance";
import {
  listLocalRangeAttendance,
  listLocalTodayAttendance,
  mergeAttendanceRangeRows,
  mergeAttendanceRows,
} from "@/lib/localAttendanceFallback";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";
import { ACCENT, BORDER, CARD, MUTED, NAVY, SURFACE, field, tableShell } from "@/lib/platformStyles";

const RANGES = ["monthly", "3months", "6months", "yearly", "custom"];

const DIST = [
  { key: "present", ar: "حاضر", en: "Present", color: "#1E9E63" },
  { key: "late", ar: "متأخر", en: "Late", color: "#B45309" },
  { key: "absent", ar: "غائب", en: "Absent", color: "#DC2626" },
  { key: "onLeave", ar: "في إجازة", en: "On leave", color: "#1D4ED8" },
  { key: "notScheduled", ar: "غير مجدول", en: "Unscheduled", color: "#94A3B8" },
];

const pillBtn = (on) => ({
  padding: "4px 11px",
  borderRadius: 20,
  border: `1px solid ${on ? "#BBF7D0" : BORDER}`,
  background: on ? "#ECFDF3" : CARD,
  color: on ? NAVY : MUTED,
  fontSize: 11,
  fontWeight: on ? 600 : 400,
  cursor: "pointer",
  fontFamily: "inherit",
});

function summarizeEmployee(employee, rows) {
  const summary = (rows || []).reduce(
    (total, row) => {
      if (row.status === "present") total.present += 1;
      if (row.status === "late") {
        if (row.excused) total.excusedLate += 1;
        else total.late += 1;
        total.lateMinutesSum += Number(row.late_minutes) || 0;
      }
      if (row.status === "absent" && !row.excused) total.absent += 1;
      return total;
    },
    { employeeId: employee.id, present: 0, late: 0, excusedLate: 0, absent: 0, lateMinutesSum: 0, recorded: (rows || []).length },
  );
  const worked = summary.present + summary.late + summary.excusedLate;
  const counted = worked + summary.absent;
  return {
    ...summary,
    name: employee.name,
    attendanceRate: counted ? Math.round((worked / counted) * 1000) / 10 : null,
    lateEvents: summary.late + summary.excusedLate,
  };
}

export default function AttendanceAnalytics({ employees, company, data, t }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [range, setRange] = useState("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [stats, setStats] = useState([]);
  const [todayRows, setTodayRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const rangeLabel = (value) =>
    ({
      monthly: t("rangeMonthly"),
      "3months": t("range3Months"),
      "6months": t("preset6Months"),
      yearly: t("rangeYearly"),
      custom: t("rangeCustom"),
    }[value] || value);

  const dateWindow = useMemo(() => {
    const end = range === "custom" && customEnd ? moment(customEnd) : moment();
    let start = moment().subtract(1, "month");
    if (range === "3months") start = moment().subtract(3, "months");
    if (range === "6months") start = moment().subtract(6, "months");
    if (range === "yearly") start = moment().subtract(1, "year");
    if (range === "custom" && customStart) start = moment(customStart);
    return { startDate: start.format("YYYY-MM-DD"), endDate: end.format("YYYY-MM-DD") };
  }, [range, customStart, customEnd]);

  useEffect(() => {
    if (!employees.length) {
      setStats([]);
      setTodayRows([]);
      return;
    }
    setLoading(true);
    const localRange = listLocalRangeAttendance(company?.id, dateWindow.startDate, dateWindow.endDate, data);
    Promise.all([
      Promise.all(
        employees.map((employee) =>
          base44.functions
            .invoke("supabaseAttendance", { action: "listRange", employeeId: employee.id, ...dateWindow })
            .then((res) => ({ employee, rows: res?.data?.rows || [] }))
            .catch(() => ({ employee, rows: [] })),
        ),
      ),
      base44.functions
        .invoke("supabaseAttendance", { action: "listDaily", employeeIds: employees.map((e) => e.id) })
        .then((res) => res?.data?.rows || [])
        .catch(() => []),
    ])
      .then(([rangeSets, daily]) => {
        const cloudRange = rangeSets.flatMap((item) => item.rows);
        const mergedRange = mergeAttendanceRangeRows(cloudRange, localRange);
        setStats(employees.map((employee) => {
          const rows = mergedRange.filter((row) => String(row.employee_id ?? row.employeeId) === String(employee.id));
          return summarizeEmployee(employee, rows);
        }));
        setTodayRows(mergeAttendanceRows(daily, listLocalTodayAttendance(company?.id, data)));
      })
      .catch(() => {
        setStats(employees.map((employee) => {
          const rows = localRange.filter((row) => String(row.employee_id ?? row.employeeId) === String(employee.id));
          return summarizeEmployee(employee, rows);
        }));
        setTodayRows(mergeAttendanceRows([], listLocalTodayAttendance(company?.id, data)));
      })
      .finally(() => setLoading(false));
  }, [dateWindow.startDate, dateWindow.endDate, employees.map((e) => e.id).join(","), company?.id]);

  const todayAtt = deriveTeamAttendanceToday(employees, todayRows, data);
  const distValues = {
    present: todayAtt.present,
    late: todayAtt.late,
    absent: todayAtt.absent,
    onLeave: todayAtt.onLeave,
    notScheduled: todayAtt.notScheduled,
  };
  const distTotal = DIST.reduce((sum, item) => sum + (distValues[item.key] || 0), 0) || 1;
  const dailyWorkHours = todayRows.reduce((sum, row) => sum + (Number(row.work_hours) || 0), 0);
  const rated = stats.filter((s) => s.attendanceRate != null);
  const avgRate = rated.length
    ? Math.round((rated.reduce((sum, s) => sum + s.attendanceRate, 0) / rated.length) * 10) / 10
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} dir={ar ? "rtl" : "ltr"}>
      <div style={{ ...tableShell, padding: "12px 14px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div style={{ flex: "1 1 200px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{t("employeeComparisonLabel")}</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>
            {dateWindow.startDate} → {dateWindow.endDate}
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {RANGES.map((value) => (
            <button key={value} type="button" onClick={() => setRange(value)} style={pillBtn(range === value)}>
              {rangeLabel(value)}
            </button>
          ))}
          {range === "custom" && (
            <>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ ...field, width: "auto" }} />
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ ...field, width: "auto" }} />
            </>
          )}
          <ComparisonExportButtons
            title={`${t("employeeComparisonLabel")} — ${dateWindow.startDate} → ${dateWindow.endDate}`}
            headers={ar ? ["الموظف", "نسبة الحضور", "حاضر", "متأخر", "غائب"] : ["Employee", "Rate", "Present", "Late", "Absent"]}
            rows={stats.map((s) => [
              employees.find((e) => e.id === s.employeeId)?.name || s.employeeId,
              s.attendanceRate ?? "—",
              s.present,
              s.late,
              s.absent,
            ])}
            compact
          />
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <section style={{ ...tableShell, padding: "14px 16px", flex: "1 1 280px", minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{ar ? "توزيع اليوم" : "Today's mix"}</div>
          <div style={{ display: "flex", height: 18, borderRadius: 8, overflow: "hidden", marginTop: 14, background: SURFACE }}>
            {DIST.map((item) => {
              const value = distValues[item.key] || 0;
              if (!value) return null;
              return (
                <span
                  key={item.key}
                  title={`${ar ? item.ar : item.en} ${value}`}
                  style={{ width: `${(value / distTotal) * 100}%`, background: item.color, minWidth: value ? 4 : 0 }}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            {DIST.map((item) => (
              <span key={item.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: MUTED }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                {ar ? item.ar : item.en}
                <strong style={{ color: NAVY, fontWeight: 600 }}>{distValues[item.key] || 0}</strong>
              </span>
            ))}
          </div>
          <p style={{ margin: "14px 0 0", fontSize: 12, color: MUTED }}>
            {ar ? "إجمالي ساعات العمل اليوم" : "Total work hours today"}
            {" · "}
            <strong style={{ color: NAVY, fontWeight: 600 }}>{dailyWorkHours.toFixed(1)}</strong>
          </p>
        </section>

        <section style={{ ...tableShell, padding: "14px 16px", flex: "2 1 420px", minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{ar ? "نسبة الحضور لكل موظف" : "Attendance rate by employee"}</div>
            <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 22, fontWeight: 600, color: avgRate >= 80 ? ACCENT : "#DC2626" }}>
              {avgRate}%
            </div>
          </div>
          {loading ? (
            <p style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: MUTED }}>{ar ? "جاري التحميل…" : "Loading…"}</p>
          ) : stats.length === 0 ? (
            <p style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: MUTED }}>{t("noAnalyticsDataAttendance")}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {stats.map((item) => {
                const rate = item.attendanceRate;
                const note = rate == null
                  ? (ar ? "لا تسجيل" : "No record")
                  : item.lateEvents === 0
                    ? (ar ? "بلا تأخير" : "No delay")
                    : (ar ? `${item.lateEvents} تأخير` : `${item.lateEvents} late`);
                return (
                  <div key={item.employeeId} style={{ display: "grid", gridTemplateColumns: "minmax(88px,0.9fr) minmax(80px,1.4fr) auto", gap: 10, alignItems: "center" }}>
                    <EmployeeNameLink
                      employeeId={item.employeeId}
                      employeeName={item.name || "—"}
                      style={{ fontSize: 12, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    />
                    <div style={{ height: 8, borderRadius: 6, background: SURFACE, overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", width: `${rate ?? 0}%`, background: rate == null ? BORDER : rate >= 80 ? ACCENT : "#DC2626", borderRadius: 6 }} />
                    </div>
                    <span style={{ fontSize: 11, color: MUTED, whiteSpace: "nowrap" }}>
                      {rate == null ? "—" : `${rate}%`}
                      {" · "}
                      {note}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p style={{ margin: "14px 0 0", fontSize: 10, color: MUTED }}>
            {ar ? "النسبة محسوبة على الأيام المجدولة فقط" : "Rate is calculated on scheduled days only"}
          </p>
        </section>
      </div>
    </div>
  );
}
