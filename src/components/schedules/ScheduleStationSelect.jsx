import React from "react";
import MobileSelect from "@/components/mobile/MobileSelect";
import { getMonthDates, dateKey } from "@/components/schedules/StationScheduleEditor";

// One searchable selector instead of a grid of identical station cards.
// Each option carries what actually differs: shift count and uncovered days.
export function stationScheduleSummary(station, schedules, ar) {
  const schedule = (schedules || []).find((s) => s.stationId === station.id);
  const shiftTypes = schedule?.shiftTypes || [];
  const now = new Date();
  const uncovered = getMonthDates(now.getFullYear(), now.getMonth()).filter((date) => {
    const day = schedule?.assignments?.[dateKey(date)] || {};
    return !shiftTypes.some((type) => (day[type.id] || []).length > 0);
  }).length;
  const parts = [`${shiftTypes.length} ${ar ? "ورديات" : "shifts"}`];
  if (uncovered) parts.push(`${uncovered} ${ar ? "يوم بلا تغطية" : "days uncovered"}`);
  return { label: `${station.name} · ${parts.join(" · ")}`, uncovered };
}

export default function ScheduleStationSelect({ stations, schedules, value, onChange, ar }) {
  return (
    <MobileSelect
      value={value}
      onChange={onChange}
      searchable
      searchPlaceholder={ar ? "ابحث عن مقر..." : "Search a site..."}
      placeholder={ar ? "المحطة" : "Site"}
      className="w-full sm:w-80"
      options={stations.map((station) => ({ value: station.id, label: stationScheduleSummary(station, schedules, ar).label }))}
    />
  );
}