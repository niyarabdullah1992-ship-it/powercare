import React from "react";
import { Building2 } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";

// نفس تنظيم بطاقة السلامة: عنوان أعلى البطاقة وقائمة اختيار المحطة داخلها.
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
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="flex items-center gap-1.5 text-sm font-body text-accent">
        <Building2 className="h-4 w-4" /> {ar ? "الحضور حسب المحطة" : "Attendance by station"}
      </p>
      <MobileSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={allLabel}
        searchable
        searchPlaceholder={ar ? "ابحث عن محطة..." : "Search stations..."}
        className="w-full"
      />
    </div>
  );
}