import React, { useState } from "react";
import { Check, Search } from "lucide-react";

// Assign one task to several members at once — inline list with quick search.
export default function MemberMultiSelect({ members, selected, onChange, lang }) {
  const ar = lang === "ar";
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? members.filter((m) => (m.name || "").toLowerCase().includes(q)) : members;
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  if (members.length === 0) {
    return <p className="text-xs text-muted-foreground font-body">{ar ? "لا يوجد أعضاء في هذه المحطة." : "No members in this station."}</p>;
  }

  return (
    <div className="rounded-lg border border-input bg-card p-1.5">
      <div className="relative mb-1.5">
        <Search className="absolute top-1/2 start-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ar ? "ابحث عن عضو..." : "Search member..."}
          className="w-full rounded-md border border-input px-8 py-1.5 text-sm font-body"
        />
      </div>
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {shown.length === 0 ? (
          <p className="p-2 text-xs text-muted-foreground font-body">{ar ? "لا توجد نتائج." : "No results."}</p>
        ) : shown.map((m) => {
          const on = selected.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-start text-sm font-body hover:bg-muted"
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-accent bg-accent text-accent-foreground" : "border-input"}`}>
                {on && <Check className="h-3 w-3" />}
              </span>
              <span className="truncate">{m.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}