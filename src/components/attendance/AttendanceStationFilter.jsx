import React from "react";
import { Building2 } from "lucide-react";

// كل محطة لها حضور وانصراف وجدولة خاصة بها — هذا المحدّد يحصر كل تبويبات
// الحضور على محطة واحدة، ويعرض عدد موظفي كل محطة.
export default function AttendanceStationFilter({ stations, value, onChange, countFor, lang }) {
  if (!stations?.length) return null;
  const ar = lang === "ar";

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" /> {ar ? "المحطة" : "Station"}
      </p>
      <div className="flex flex-wrap gap-2">
        {[{ id: "all", name: ar ? "كل المحطات" : "All stations" }, ...stations].map((station) => (
          <button
            key={station.id}
            type="button"
            onClick={() => onChange(station.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-body transition ${value === station.id ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
          >
            {station.name}
            <span className={value === station.id ? "opacity-70" : "text-muted-foreground"}> · {countFor(station.id)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}