import React from "react";
import MobileSelect from "@/components/mobile/MobileSelect";

// نفس شكل محدّد السلامة: قائمة واحدة لاختيار المحطة، وكل محطة تعرض حضورها فقط.
export default function AttendanceStationFilter({ stations, value, onChange, countFor, lang }) {
  const ar = lang === "ar";
  const allLabel = ar ? "كل المحطات" : "All stations";
  const options = [
    { value: "all", label: `${allLabel} (${countFor("all")})` },
    ...stations.map((station) => ({
      value: station.id,
      label: `${station.name} (${countFor(station.id)})`,
    })),
  ];

  return (
    <MobileSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={allLabel}
      searchable
      searchPlaceholder={ar ? "ابحث عن محطة..." : "Search stations..."}
      className="w-full"
    />
  );
}