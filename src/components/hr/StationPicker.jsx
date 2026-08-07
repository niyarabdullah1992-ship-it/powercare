import React, { useState } from "react";
import { Search } from "lucide-react";

// Searchable, scrollable checkbox-list station picker — used anywhere HR positions
// need to be scoped to one or more stations, instead of a long wrapped pill row.
export default function StationPicker({ stations, selected, onToggle, t }) {
  const [query, setQuery] = useState("");
  const filtered = (stations || []).filter((station) => `${station.name || ""} ${station.location || ""}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          className="w-full ps-8 pe-2.5 py-1.5 rounded-md border border-input text-xs font-body"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto rounded-md border border-border p-1.5">
        {filtered.length === 0 ? (
          <p className="col-span-full text-xs text-muted-foreground font-body italic px-2 py-1.5">{t("noResults")}</p>
        ) : (
          filtered.map((s) => {
            const checked = selected.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onToggle(s.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-body text-start transition ${checked ? "bg-foreground text-background" : "hover:bg-muted"}`}
              >
                <span className={`w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center ${checked ? "bg-background border-background" : "border-current"}`}>
                  {checked && <span className="w-2 h-2 rounded-[1px] bg-foreground" />}
                </span>
                <span className="truncate">{s.name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}