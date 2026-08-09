import React, { useState } from "react";
import { Check, Search, X } from "lucide-react";

// مستوى واحد لاختيار المنفّذ: ابحث بالاسم مباشرة وتظهر المحطة تحته.
export default function AssigneeSearchSelect({ members, selected, onChange, stationNameOf, lang }) {
  const ar = lang === "ar";
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = (q ? members.filter((m) => (m.name || "").toLowerCase().includes(q)) : members).slice(0, 40);
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const m = members.find((x) => x.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-body">
                {m?.name || id}
                <button type="button" onClick={() => toggle(id)}><X className="h-3 w-3" /></button>
              </span>
            );
          })}
        </div>
      )}
      <div className="relative">
        <Search className="absolute top-1/2 start-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ar ? "ابحث بالاسم..." : "Search by name..."}
          className="w-full rounded-md border border-input px-8 py-2 text-sm font-body"
        />
      </div>
      <div className="max-h-52 divide-y divide-border overflow-y-auto rounded-lg border border-input">
        {shown.length === 0 ? (
          <p className="p-3 text-xs font-body text-muted-foreground">{ar ? "لا توجد نتائج." : "No results."}</p>
        ) : shown.map((m) => {
          const on = selected.includes(m.id);
          return (
            <button key={m.id} type="button" onClick={() => toggle(m.id)} className="flex w-full items-center gap-2.5 px-3 py-2 text-start hover:bg-muted">
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-accent bg-accent text-accent-foreground" : "border-input"}`}>
                {on && <Check className="h-3 w-3" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-body">{m.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{stationNameOf(m)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}