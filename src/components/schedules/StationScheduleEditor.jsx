import React from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { moveShift } from "@/lib/store";
import DayTimelineRow from "@/components/schedules/DayTimelineRow";

const DAYS = [
  { key: 0, label: "daySun" }, { key: 1, label: "dayMon" }, { key: 2, label: "dayTue" },
  { key: 3, label: "dayWed" }, { key: 4, label: "dayThu" }, { key: 5, label: "dayFri" }, { key: 6, label: "daySat" },
];

export default function StationScheduleEditor({ companyId, stationId, canManage }) {
  const { t } = useI18n();
  const { data } = useAuth();
  const schedule = (data.schedules || []).find((s) => s.stationId === stationId);
  const stationEmployees = (data.employees || []).filter((e) => e.stationId === stationId);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const fromDay = Number(result.source.droppableId.replace("day-", ""));
    const toDay = Number(result.destination.droppableId.replace("day-", ""));
    if (fromDay === toDay) return;
    moveShift(companyId, stationId, fromDay, toDay, result.draggableId);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="space-y-4">
        {DAYS.map(({ key, label }) => (
          <DayTimelineRow
            key={key}
            companyId={companyId}
            stationId={stationId}
            day={key}
            dayLabel={t(label)}
            shifts={schedule?.days?.[key] || []}
            canManage={canManage}
            employees={stationEmployees}
          />
        ))}
      </div>
    </DragDropContext>
  );
}