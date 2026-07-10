import React from "react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { addShiftType } from "@/lib/store";
import { Plus } from "lucide-react";
import ShiftTypeEditor from "./ShiftTypeEditor";
import ScheduleCell from "./ScheduleCell";
import ScheduleStatsBar from "./ScheduleStatsBar";

const DAY_KEYS = ["daySun", "dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat"];

function getWeekDates() {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

export default function StationScheduleEditor({ companyId, stationId, canManage }) {
  const { data } = useAuth();
  const { t } = useI18n();
  const schedule = (data.schedules || []).find((s) => s.stationId === stationId);
  const shiftTypes = schedule?.shiftTypes || [];
  const assignments = schedule?.assignments || {};
  const stationEmployees = (data.employees || []).filter((e) => e.stationId === stationId);
  const weekDates = getWeekDates();

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

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-start p-3 font-body text-xs text-muted-foreground w-40">{t("shift")}</th>
              {weekDates.map((d, i) => (
                <th key={i} className="p-3 font-body text-xs text-muted-foreground text-center">
                  <div className="font-heading font-semibold text-foreground">{t(DAY_KEYS[i])}</div>
                  <div>{d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shiftTypes.map((st) => (
              <tr key={st.id} className="border-b border-border last:border-0 align-top">
                <td className="p-3 font-body">
                  <p className="font-semibold text-sm">{st.label}</p>
                  <p className="text-xs text-muted-foreground">{st.start} – {st.end}</p>
                </td>
                {DAY_KEYS.map((_, dayIndex) => (
                  <td key={dayIndex} className="p-2 border-s border-border">
                    <ScheduleCell
                      companyId={companyId}
                      stationId={stationId}
                      day={dayIndex}
                      shiftTypeId={st.id}
                      employeeIds={assignments?.[dayIndex]?.[st.id] || []}
                      employees={stationEmployees}
                      canManage={canManage}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {shiftTypes.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-sm text-muted-foreground font-body">{t("noShifts")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ScheduleStatsBar employees={stationEmployees} shiftTypes={shiftTypes} assignments={assignments} />
    </div>
  );
}