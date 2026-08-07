import React, { useMemo, useState } from "react";
import { Building2, Search, Users, X } from "lucide-react";

// كل محطة لها حضور وانصراف وجدولة خاصة بها — محدّد مرتّب بالبحث وشبكة بطاقات،
// مع بطاقة ثابتة لكل المحطات وعدد الموظفين في كل محطة.
export default function AttendanceStationFilter({ stations, value, onChange, countFor, lang }) {
  const ar = lang === "ar";
  const [query, setQuery] = useState("");

  const sorted = useMemo(
    () => [...(stations || [])].sort((a, b) => a.name.localeCompare(b.name, ar ? "ar" : "en")),
    [stations, ar]
  );
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? sorted.filter((station) => station.name.toLowerCase().includes(term)) : sorted;
  }, [sorted, query]);

  if (!stations?.length) return null;

  const cardClass = (active) =>
    `flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-start text-sm font-body transition ${active ? "border-accent bg-accent/10 text-foreground" : "border-border bg-card hover:border-accent/50 hover:bg-muted"}`;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" /> {ar ? "المحطة" : "Station"}
        </p>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ar ? "ابحث عن محطة…" : "Search a station…"}
            className="w-full rounded-md border border-input py-2 pe-8 ps-9 text-sm font-body"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute inset-y-0 end-2 my-auto text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <button type="button" onClick={() => onChange("all")} className={`w-full ${cardClass(value === "all")}`}>
        <span className="font-medium">{ar ? "كل المحطات" : "All stations"}</span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" /> {countFor("all")}</span>
      </button>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{ar ? "لا توجد محطة مطابقة." : "No station matches."}</p>
      ) : (
        <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((station) => (
            <button key={station.id} type="button" onClick={() => onChange(station.id)} className={cardClass(value === station.id)}>
              <span className="truncate">{station.name}</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" /> {countFor(station.id)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}