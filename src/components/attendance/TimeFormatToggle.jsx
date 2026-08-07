import React from "react";
import { Clock3 } from "lucide-react";
import { useTimeFormat } from "@/hooks/useTimeFormat";

export default function TimeFormatToggle({ lang }) {
  const { format, setFormat } = useTimeFormat();
  const label = lang === "ar" ? "نظام الساعة" : "Time format";

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-md border border-border p-1 text-xs font-body">
      <Clock3 className="mx-1 h-3.5 w-3.5 text-muted-foreground" />
      <span className="hidden sm:inline text-muted-foreground">{label}</span>
      {["12", "24"].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setFormat(value)}
          className={`rounded px-2 py-1 transition ${format === value ? "bg-foreground text-background" : "hover:bg-muted"}`}
        >
          {value}
        </button>
      ))}
    </div>
  );
}