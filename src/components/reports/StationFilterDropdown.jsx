import React, { useState, useRef, useEffect } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";

// Compact multi-select dropdown for station filtering — replaces a long wrapping
// pill row (which looks broken once there are many stations) with a single control.
export default function StationFilterDropdown({ t, options, selected, onToggle, onSelectAll, onClearAll }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const allSelected = options.length > 0 && options.every((o) => selected.includes(o.key));
  const label = allSelected ? t("all") : `${selected.length}/${options.length}`;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted"
      >
        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
        {t("stations")} ({label})
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1.5 w-56 max-h-72 overflow-y-auto bg-card border border-border rounded-md shadow-xl py-1">
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border">
            <button onClick={onSelectAll} className="text-[11px] text-accent hover:underline">{t("all")}</button>
            <button onClick={onClearAll} className="text-[11px] text-muted-foreground hover:underline">{t("cancel")}</button>
          </div>
          {options.map((o) => {
            const isSelected = selected.includes(o.key);
            return (
              <button
                key={o.key}
                onClick={() => onToggle(o.key)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-body hover:bg-muted text-start"
              >
                <span className="truncate">{o.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}