import React from "react";
import { Check, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatDateTime } from "@/lib/dateFormat";

// Who reported and who didn't — the first thing an operations manager looks for.
export default function UnitSubmissionStrip({ units, activeStation, setActiveStation }) {
  const { lang } = useI18n();
  if (!units.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wider text-accent font-body mb-2">
        {lang === "ar" ? "حالة الإرسال" : "Reporting status"}
      </p>
      <div className="flex flex-wrap gap-2">
        {units.map((u) => {
          const active = activeStation === u.id;
          return (
            <button
              key={u.id}
              onClick={() => setActiveStation(active ? "all" : u.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-body ${
                active ? "border-accent bg-accent/10" : "border-border hover:bg-muted"
              } ${u.firstAt ? "" : "text-destructive"}`}
            >
              <span className="font-medium">{u.name}</span>
              {u.firstAt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-muted-foreground">{formatDateTime(u.firstAt, lang).split(" ").slice(-2).join(" ")}</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lang === "ar" ? "لم تُرسل" : "Not reported"}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}