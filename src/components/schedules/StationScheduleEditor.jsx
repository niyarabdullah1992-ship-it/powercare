import React from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import DayScheduleColumn from "@/components/schedules/DayScheduleColumn";

const DAYS = [
  { key: 0, label: "daySun" }, { key: 1, label: "dayMon" }, { key: 2, label: "dayTue" },
  { key: 3, label: "dayWed" }, { key: 4, label: "dayThu" }, { key: 5, label: "dayFri" }, { key: 6, label: "daySat" },
];

export default function StationScheduleEditor({ companyId, stationId, canManage }) {
  const { t } = useI18n();
  const { data } = useAuth();
  const schedule = (data.schedules || []).find((s) => s.stationId === stationId);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {DAYS.map(({ key, label }) => (
        <DayScheduleColumn
          key={key}
          companyId={companyId}
          stationId={stationId}
          day={key}
          dayLabel={t(label)}
          shifts={schedule?.days?.[key] || []}
          canManage={canManage}
        />
      ))}
    </div>
  );
}