import React from "react";
import { CheckCircle2, Circle, Trash2, MapPin, Plus } from "lucide-react";

// Schedule-style hour grid for the Day Planner — mirrors the company shift
// schedule look: one row per hour, plan items and visits placed in their slots.
// Clicking an empty hour pre-fills that time in the add form.
export default function DayTimeGrid({ items, visits = [], onToggle, onRemove, onPickTime, ar }) {
  const hourOf = (hhmm) => parseInt(String(hhmm).slice(0, 2), 10);
  const timed = items.filter((i) => i.time);
  const untimed = items.filter((i) => !i.time);

  let start = 6, end = 22;
  for (const i of timed) {
    const h = hourOf(i.time);
    if (!Number.isNaN(h)) { start = Math.min(start, h); end = Math.max(end, h); }
  }
  const vHour = (iso) => new Date(iso).getHours();
  for (const v of visits) {
    start = Math.min(start, vHour(v.checkIn));
    end = Math.max(end, v.checkOut ? vHour(v.checkOut) : vHour(v.checkIn));
  }
  const hours = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const fmtH = (h) => `${String(h).padStart(2, "0")}:00`;
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString(ar ? "ar-SA" : "en-GB", { hour: "2-digit", minute: "2-digit" });

  const ItemRow = ({ item }) => (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-body ${item.done ? "border-border bg-muted/50 opacity-60" : "border-accent/30 bg-accent/10"}`}>
      <button onClick={() => onToggle(item.id)} className="shrink-0 text-accent" aria-label="toggle done">
        {item.done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
      </button>
      {item.time && <span className="shrink-0 text-accent font-medium" dir="ltr">{item.time}</span>}
      <span className={`flex-1 min-w-0 truncate ${item.done ? "line-through" : ""}`}>{item.title}</span>
      <button onClick={() => onRemove(item.id)} className="shrink-0 p-1 rounded text-muted-foreground hover:text-destructive" aria-label="delete">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-[72px_1fr] bg-muted/60 border-b border-border">
        <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-body">{ar ? "الوقت" : "Time"}</p>
        <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-body">{ar ? "خطة اليوم" : "Day plan"}</p>
      </div>

      {untimed.length > 0 && (
        <div className="grid grid-cols-[72px_1fr] border-b border-border">
          <p className="px-3 py-2.5 text-xs text-muted-foreground font-body bg-muted/30">{ar ? "بدون وقت" : "No time"}</p>
          <div className="p-2 space-y-1.5">{untimed.map((i) => <ItemRow key={i.id} item={i} />)}</div>
        </div>
      )}

      {hours.map((h) => {
        const rowItems = timed.filter((i) => hourOf(i.time) === h).sort((a, b) => a.time.localeCompare(b.time));
        const rowVisits = visits.filter((v) => vHour(v.checkIn) === h);
        const empty = rowItems.length === 0 && rowVisits.length === 0;
        return (
          <div key={h} className="grid grid-cols-[72px_1fr] border-b border-border last:border-b-0">
            <p className="px-3 py-2.5 text-xs text-muted-foreground font-body bg-muted/30" dir="ltr">{fmtH(h)}</p>
            {empty ? (
              <button onClick={() => onPickTime(fmtH(h))} className="group flex items-center px-3 min-h-[40px] text-start hover:bg-muted/50 transition" aria-label={`add at ${fmtH(h)}`}>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-body opacity-40 group-hover:opacity-100 transition">
                  <Plus className="w-3 h-3" /> {ar ? "إضافة هنا" : "Add here"}
                </span>
              </button>
            ) : (
              <div className="p-2 space-y-1.5">
                {rowVisits.map((v) => (
                  <div key={v.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-sky-200 bg-sky-50 text-xs font-body text-sky-700">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1 min-w-0 truncate">{v.place || "—"}</span>
                    <span dir="ltr" className="shrink-0">{fmtTime(v.checkIn)}{v.checkOut ? ` → ${fmtTime(v.checkOut)}` : ""}</span>
                  </div>
                ))}
                {rowItems.map((i) => <ItemRow key={i.id} item={i} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}