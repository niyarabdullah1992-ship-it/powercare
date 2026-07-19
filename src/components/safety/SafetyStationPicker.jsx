import React, { useMemo, useState } from "react";
import { Check, Search, SlidersHorizontal, X } from "lucide-react";

export default function SafetyStationPicker({ stations, value, onChange, lang }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ar = lang === "ar";
  const options = useMemo(() => [{ key: "all", name: ar ? "كل المحطات" : "All stations" }, ...stations.map((station) => ({ key: station.id, name: station.name }))], [stations, ar]);
  const visible = options.filter((option) => option.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const selected = options.find((option) => option.key === value) || options[0];

  return <div className="relative">
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground shadow-sm">
      <SlidersHorizontal className="h-4 w-4" />{selected.name}
    </button>
    {open && <div className="fixed inset-0 z-50 bg-foreground/20" onClick={() => setOpen(false)}>
      <aside dir={ar ? "rtl" : "ltr"} onClick={(event) => event.stopPropagation()} className="absolute inset-y-0 end-0 flex w-[min(88vw,340px)] flex-col bg-primary text-primary-foreground shadow-2xl">
        <div className="flex items-center gap-2 border-b border-accent/40 bg-accent/80 p-3">
          <button type="button" onClick={() => setOpen(false)} aria-label={ar ? "إغلاق" : "Close"} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-primary/20"><X className="h-5 w-5" /></button>
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-3">
            <Search className="h-4 w-4 text-primary-foreground/60" />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "البحث" : "Search"} className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-primary-foreground placeholder:text-primary-foreground/55 focus-visible:ring-0" />
          </label>
        </div>
        <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
          {visible.map((option) => <button key={option.key} type="button" onClick={() => { onChange(option.key); setOpen(false); }} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${value === option.key ? "border-amber-300 bg-accent text-accent-foreground shadow-sm" : "border-primary-foreground/10 bg-primary-foreground/10 hover:bg-primary-foreground/15"}`}><span className="truncate">{option.name}</span>{value === option.key && <Check className="h-4 w-4" />}</button>)}
          {!visible.length && <p className="py-8 text-center text-xs text-primary-foreground/60">{ar ? "لا توجد محطات مطابقة" : "No matching stations"}</p>}
        </div>
      </aside>
    </div>}
  </div>;
}