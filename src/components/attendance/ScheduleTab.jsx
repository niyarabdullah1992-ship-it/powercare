import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, canManageSchedule } from "@/lib/permissions";
import { ArrowLeft, CalendarClock, Download } from "lucide-react";
import StationScheduleEditor, { getMonthDates, dateKey } from "@/components/schedules/StationScheduleEditor";
import { exportCSV } from "@/lib/exportReport";

// Monthly station shift schedule — now embedded as a tab inside Attendance instead of
// a separate page, since both cover the same "who works when" concept.
export default function ScheduleTab() {
  const { t } = useI18n();
  const { data, company, currentUser } = useAuth();
  const [selectedStation, setSelectedStation] = useState(null);

  if (!data || !currentUser) return null;
  const stations = visibleStations(currentUser, data);

  if (!selectedStation) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground font-body text-sm">{t("manageScheduleNote")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((s) => (
            <button key={s.id} onClick={() => setSelectedStation(s.id)} className="text-start p-5 rounded-xl border border-border bg-card hover:border-accent transition-colors space-y-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-accent" />
                <h3 className="font-heading font-semibold">{s.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body">{t("monthlySchedule")}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const station = data.stations.find((s) => s.id === selectedStation);
  const canManage = canManageSchedule(currentUser, data, selectedStation);

  const handleExport = () => {
    const schedule = (data.schedules || []).find((s) => s.stationId === selectedStation);
    const shiftTypes = schedule?.shiftTypes || [];
    const now = new Date();
    const monthDates = getMonthDates(now.getFullYear(), now.getMonth());
    const headers = [t("shift"), ...monthDates.map((d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" }))];
    const rows = shiftTypes.map((st) => {
      const shiftCell = `${st.label} (${st.start}–${st.end})`;
      const dayCells = monthDates.map((d) => {
        const ids = schedule?.assignments?.[dateKey(d)]?.[st.id] || [];
        return ids.map((id) => data.employees.find((e) => e.id === id)?.name).filter(Boolean).join(", ");
      });
      return [shiftCell, ...dayCells];
    });
    exportCSV(`${station?.name || "schedule"}.csv`, headers, rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelectedStation(null)} className="p-2 rounded-md hover:bg-muted shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="flex-1 text-center font-heading text-xl font-semibold">{station?.name}</h3>
        <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-landing-gold/40 text-sm font-body hover:bg-landing-gold-light/20 shrink-0 whitespace-nowrap">
          <Download className="w-4 h-4" /> {t("exportExcel")}
        </button>
      </div>
      <StationScheduleEditor companyId={company.id} stationId={selectedStation} canManage={canManage} />
    </div>
  );
}