import React, { useState } from "react";
import { Check, Clock, AlertTriangle, ChevronDown, MinusCircle } from "lucide-react";
import moment from "moment";
import { useI18n } from "@/lib/i18n";
import { formatDateTime } from "@/lib/dateFormat";

// Three states, not two: reported, late, waiting — plus units that owe no report at all.
export default function UnitSubmissionStrip({ units, activeStation, setActiveStation, dueTime, onDueTimeChange }) {
  const { lang } = useI18n();
  const [showIdle, setShowIdle] = useState(false);
  const ar = lang === "ar";
  if (!units.length) return null;

  const idle = units.filter((u) => u.status === "idle");
  const activeUnits = units.filter((u) => u.status !== "idle");

  const pill = (u) => {
    const selected = activeStation === u.id;
    const tone =
      u.status === "reported" ? "" :
      u.status === "late" ? "text-destructive" :
      "text-muted-foreground";
    return (
      <button
        key={u.id}
        onClick={() => setActiveStation(selected ? "all" : u.id)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-body ${selected ? "border-accent bg-accent/10" : "border-border hover:bg-muted"} ${tone}`}
      >
        <span className="font-medium">{u.name}</span>
        {u.status === "reported" && (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-muted-foreground">{formatDateTime(u.firstAt, lang).split(" ").slice(-2).join(" ")}</span>
          </>
        )}
        {u.status === "late" && (
          <>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{ar ? `متأخر ${moment(u.lateSince).locale("ar").fromNow(true)}` : `Late by ${moment(u.lateSince).fromNow(true)}`}</span>
          </>
        )}
        {u.status === "waiting" && (
          <>
            <Clock className="w-3.5 h-3.5" />
            <span>{ar ? "بانتظار الإرسال" : "Awaiting report"}</span>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wider text-accent font-body">
          {ar ? "حالة الإرسال" : "Reporting status"}
        </p>
        {onDueTimeChange && (
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-body">
            {ar ? "موعد استحقاق التقرير" : "Report due time"}
            <input
              type="time"
              value={dueTime}
              onChange={(event) => onDueTimeChange(event.target.value)}
              className="rounded-md border border-input px-2 py-1 text-xs"
            />
          </label>
        )}
      </div>

      {activeUnits.length > 0 && <div className="flex flex-wrap gap-2">{activeUnits.map(pill)}</div>}

      {idle.length > 0 && (
        <div>
          <button
            onClick={() => setShowIdle((value) => !value)}
            className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground/80 hover:text-foreground"
          >
            <MinusCircle className="w-3.5 h-3.5" />
            {ar ? `${idle.length} وحدات بلا نشاط اليوم` : `${idle.length} units with no activity today`}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showIdle ? "rotate-180" : ""}`} />
          </button>
          {showIdle && (
            <div className="mt-2 flex flex-wrap gap-2">
              {idle.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setActiveStation(activeStation === u.id ? "all" : u.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-body text-muted-foreground/70 ${activeStation === u.id ? "border-accent bg-accent/10" : "border-border/60 hover:bg-muted"}`}
                >
                  <span>{u.name}</span>
                  <span>{ar ? "لا تقرير مطلوب" : "No report due"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}