import React from "react";
import { Lightbulb, Building2 } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormat";

// Read-only board gathering every suggestion (public or anonymous) filed by staff.
export default function SuggestionsBoard({ items, lang, t }) {
  const ar = lang === "ar";
  if (!items.length) {
    return <p className="text-sm text-muted-foreground font-body">{ar ? "لا توجد اقتراحات بعد." : "No suggestions yet."}</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((s) => (
        <div key={s.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-body font-medium">
              <Lightbulb className="w-3.5 h-3.5 text-accent" /> {s.author}
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-body">
                <Building2 className="w-3 h-3" /> {s.station}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-body bg-muted text-muted-foreground">{s.badge}</span>
            </div>
          </div>
          <p className="text-sm font-body">{s.message}</p>
          <p className="text-[11px] text-muted-foreground font-body">{formatDateTime(s.createdAt, lang)} · {t(s.status || "open")}</p>
        </div>
      ))}
    </div>
  );
}