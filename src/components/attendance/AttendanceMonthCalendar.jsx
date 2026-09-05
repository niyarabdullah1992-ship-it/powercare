import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { attendanceRowDateKey, monthGridDays } from "@/lib/attendanceCalendar";
import { listLocalRangeAttendance, mergeAttendanceRangeRows } from "@/lib/localAttendanceFallback";
import AttendanceMonthCalendarGrid from "@/components/attendance/AttendanceMonthCalendarGrid";
import { ACCENT, BORDER, MUTED, NAVY, tableShell, ui } from "@/lib/platformStyles";

const navBtn = {
  ...ui.btnGhost,
  padding: "6px 8px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export default function AttendanceMonthCalendar({ employees = [], currentUser, company, data }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [cursor, setCursor] = useState(() => new Date());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, "0")}`;
  const roster = employees.length ? employees : (currentUser ? [currentUser] : []);
  const teamView = roster.length > 1;

  useEffect(() => {
    let active = true;
    setLoading(true);
    const localRows = listLocalRangeAttendance(company?.id, startDate, endDate, data);
    Promise.all(
      roster.map((employee) =>
        base44.functions
          .invoke("supabaseAttendance", { action: "listRange", employeeId: employee.id, startDate, endDate })
          .then((res) => res?.data?.rows || [])
          .catch(() => []),
      ),
    )
      .then((sets) => {
        if (!active) return;
        setRows(mergeAttendanceRangeRows(sets.flat(), localRows));
      })
      .catch(() => {
        if (active) setRows(localRows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [startDate, endDate, roster.map((e) => e.id).join(","), company?.id]);

  const rowsByDate = useMemo(() => {
    const map = {};
    for (const row of rows) {
      const key = attendanceRowDateKey(row);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(row);
    }
    return map;
  }, [rows]);

  const days = monthGridDays(year, month);
  const label = new Date(year, month, 1).toLocaleDateString(lang === "ar" ? "ar" : lang, {
    month: "long",
    year: "numeric",
    calendar: "gregory",
  });
  const move = (amount) => setCursor(new Date(year, month + amount, 1));
  const schedules = data?.schedules || [];

  return (
    <section style={tableShell} dir={ar ? "rtl" : "ltr"}>
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${BORDER}`, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: NAVY }}>
            {ar ? "تقويم الحضور" : "Attendance calendar"}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 10, color: MUTED, lineHeight: 1.5 }}>
            {ar
              ? "أيام الحضور والغياب على الجدول الشهري — يغذي المسير لاحقاً"
              : "Present and absent days on the monthly grid — they feed payroll later"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button type="button" onClick={() => move(-1)} style={navBtn} aria-label="Previous month">
            {ar ? <ChevronRight style={{ width: 14, height: 14 }} /> : <ChevronLeft style={{ width: 14, height: 14 }} />}
          </button>
          <span style={{ minWidth: 120, textAlign: "center", fontSize: 12, fontWeight: 600, color: NAVY, textTransform: "capitalize" }}>{label}</span>
          <button type="button" onClick={() => move(1)} style={navBtn} aria-label="Next month">
            {ar ? <ChevronLeft style={{ width: 14, height: 14 }} /> : <ChevronRight style={{ width: 14, height: 14 }} />}
          </button>
        </div>
      </div>
      <div style={{ padding: 12 }}>
        {loading ? (
          <div style={{ display: "flex", height: 180, alignItems: "center", justifyContent: "center" }}>
            <Loader2 style={{ width: 18, height: 18, color: ACCENT, animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <AttendanceMonthCalendarGrid
            days={days}
            rowsByDate={rowsByDate}
            employees={roster}
            schedules={schedules}
            currentUser={currentUser}
            lang={lang}
            teamView={teamView}
          />
        )}
      </div>
    </section>
  );
}
