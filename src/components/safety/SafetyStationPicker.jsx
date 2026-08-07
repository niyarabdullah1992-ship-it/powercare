import React from "react";
import MobileSelect from "@/components/mobile/MobileSelect";

export default function SafetyStationPicker({ stations, value, onChange, lang }) {
  const ar = lang === "ar";
  const allLabel = ar ? "كل المحطات" : "All stations";
  const options = [
    { value: "all", label: allLabel },
    ...stations.map((station) => ({
      value: station.id,
      label: station.location ? `${station.name} — ${station.location}` : station.name,
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