import React, { useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

// Mobile-friendly replacement for native <select>: opens a bottom sheet on
// phones and a centered menu on larger screens. Works controlled
// (value + onChange) or uncontrolled inside forms (defaultValue + name).
export default function MobileSelect({ options = [], value, defaultValue, onChange, name, placeholder, className = "", searchable = false, searchPlaceholder }) {
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState(defaultValue ?? "");
  const [query, setQuery] = useState("");
  const current = value !== undefined ? value : inner;
  const selected = options.find((o) => String(o.value) === String(current));
  const visibleOptions = searchable ? options.filter((option) => String(option.label || "").toLowerCase().includes(query.trim().toLowerCase())) : options;

  const pick = (v) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
    setQuery("");
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setQuery(""); setOpen(true); }}
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-input bg-card text-sm font-body text-start ${className}`}
      >
        <span className={`truncate ${selected ? "" : "text-muted-foreground"}`} dir="auto">
          {selected?.label || placeholder || "—"}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </button>
      {name && <input type="hidden" name={name} value={current} />}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center sm:justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-card rounded-t-2xl sm:rounded-xl border border-border max-h-[70vh] overflow-y-auto pb-safe shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {placeholder && (
              <p className={`px-4 pt-4 pb-2 text-xs uppercase tracking-wider text-muted-foreground font-body bg-card ${searchable ? "" : "sticky top-0"}`}>
                {placeholder}
              </p>
            )}
            {searchable && <label className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-4 py-3"><Search className="h-4 w-4 shrink-0 text-muted-foreground" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder || "Search..."} className="h-9 min-w-0 flex-1 rounded-md border border-input px-3 text-sm" /></label>}
            {searchable && !visibleOptions.length && <p className="px-4 py-6 text-center text-sm text-muted-foreground">No results</p>}
            {visibleOptions.map((o) => (
              <button
                key={String(o.value)}
                type="button"
                onClick={() => pick(o.value)}
                dir="auto"
                className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-body text-start hover:bg-muted ${
                  String(o.value) === String(current) ? "text-accent font-medium" : ""
                }`}
              >
                <span className="truncate">{o.label}</span>
                {String(o.value) === String(current) && <Check className="w-4 h-4 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}