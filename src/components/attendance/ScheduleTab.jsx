import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, canManageSchedule } from "@/lib/permissions";
import StationScheduleEditor, { getMonthDates, dateKey } from "@/components/schedules/StationScheduleEditor";
import ScheduleStationSelect from "@/components/schedules/ScheduleStationSelect";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";
import { formatTime, useTimeFormat } from "@/hooks/useTimeFormat";

// Monthly station shift schedule — now embedded as a tab inside Attendance instead of
// a separate page, since both cover the same "who works when" concept.
export default function ScheduleTab() {
  const { t, lang } = useI18n();
  const { format } = useTimeFormat();
  const { data, company, currentUser } = useAuth();
  const [stationId, setStationId] = useState(null);

  if (!data || !currentUser) return null;
  const stations = visibleStations(currentUser, data);
  const selectedStation = stationId || stations[0]?.id || null;
  if (!selectedStation) return <p className="text-sm text-muted-foreground font-body">{t("manageScheduleNote")}</p>;

  const station = data.stations.find((s) => s.id === selectedStation);
  const canManage = canManageSchedule(currentUser, data, selectedStation);

  const schedule = (data.schedules || []).find((s) => s.stationId === selectedStation);
  const shiftTypes = schedule?.shiftTypes || [];
  const now = new Date();
  const monthDates = getMonthDates(now.getFullYear(), now.getMonth());
  const exportHeaders = [t("shift"), ...monthDates.map((d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" }))];
  const exportRows = shiftTypes.map((st) => [
    `${st.label} (${formatTime(st.start, format, lang)}–${formatTime(st.end, format, lang)})`,
    ...monthDates.map((d) => {
      const ids = schedule?.assignments?.[dateKey(d)]?.[st.id] || [];
      return ids.map((id) => data.employees.find((e) => e.id === id)?.name).filter(Boolean).join(", ");
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ScheduleStationSelect stations={stations} schedules={data.schedules} value={selectedStation} onChange={setStationId} ar={lang === "ar"} />
        <div className="ms-auto">
          <ComparisonExportButtons title={`${t("monthlySchedule")} — ${station?.name || ""}`} headers={exportHeaders} rows={exportRows} />
        </div>
      </div>
      <StationScheduleEditor companyId={company.id} stationId={selectedStation} canManage={canManage} />
    </div>
  );
}