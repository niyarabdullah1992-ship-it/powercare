import React, { useState } from "react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { addShiftType } from "@/lib/store";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import ShiftTypeEditor from "./ShiftTypeEditor";
import ScheduleCell from "./ScheduleCell";
import ScheduleStatsBar from "./ScheduleStatsBar";
import { formatTime, useTimeFormat } from "@/hooks/useTimeFormat";

const DAY_KEYS = ["daySun", "dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat"];

export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getMonthDates(year, month) {
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
}

export default function StationScheduleEditor({ companyId, stationId, canManage }) {
  const { data } = useAuth();
  const { t, lang } = useI18n();
  const { format } = useTimeFormat();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const schedule = (data.schedules || []).find((s) => s.stationId === stationId);
  const shiftTypes = schedule?.shiftTypes || [];
  const assignments = schedule?.assignments || {};
  const defaultStationId = data.stations?.[0]?.id || null;
  const stationEmployees = (data.employees || []).filter((e) => (e.stationId || defaultStationId) === stationId);
  const monthDates = getMonthDates(cursor.year, cursor.month);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(lang, { month: "long", year: "numeric" });
  const changeMonth = (delta) => {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const handleAddShiftType = () => {
    addShiftType(companyId, stationId, { label: t("newShift"), start: "08:00", end: "16:00" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {shiftTypes.map((st, i) => (
          <ShiftTypeEditor key={st.id} companyId={companyId} stationId={stationId} shiftType={st} index={i} canManage={canManage} />
        ))}
        {canManage && (
          <button
            onClick={handleAddShiftType}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-dashed border-accent text-accent text-xs font-body hover:bg-accent/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {t("addShift")}
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-md hover:bg-muted"><ChevronRight className="w-4 h-4 rtl:hidden" /><ChevronLeft className="w-4 h-4 hidden rtl:block" /></button>
        <h4 className="font-heading font-semibold text-sm min-w-[140px] text-center capitalize">{monthLabel}</h4>
        <button onClick={() => changeMonth(1)} className="p-1.5 rounded-md hover:bg-muted"><ChevronLeft className="w-4 h-4 rtl:hidden" /><ChevronRight className="w-4 h-4 hidden rtl:block" /></button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-start p-3 font-body text-xs text-muted-foreground w-40 sticky start-0 bg-card">{t("shift")}</th>
              {monthDates.map((d, i) => (
                <th key={i} className="p-2 font-body text-xs text-muted-foreground text-center min-w-[70px]">
                  <div className="font-heading font-semibold text-foreground">{d.getDate()}</div>
                  <div>{t(DAY_KEYS[d.getDay()])?.slice(0, 3)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shiftTypes.map((st) => (
              <tr key={st.id} className="border-b border-border last:border-0 align-top">
                <td className="p-3 font-body sticky start-0 bg-card">
                  <p className="font-semibold text-sm">{st.label}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(st.start, format, lang)} – {formatTime(st.end, format, lang)}</p>
                </td>
                {monthDates.map((d) => {
                  const key = dateKey(d);
                  return (
                    <td key={key} className="p-2 border-s border-border">
                      <ScheduleCell
                        companyId={companyId}
                        stationId={stationId}
                        day={key}
                        shiftTypeId={st.id}
                        employeeIds={assignments?.[key]?.[st.id] || []}
                        employees={stationEmployees}
                        canManage={canManage}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            {shiftTypes.length === 0 && (
              <tr>
                <td colSpan={monthDates.length + 1} className="p-6 text-center text-sm text-muted-foreground font-body">{t("noShifts")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ScheduleStatsBar employees={stationEmployees} shiftTypes={shiftTypes} assignments={assignments} monthDates={monthDates} />
    </div>
  );
}