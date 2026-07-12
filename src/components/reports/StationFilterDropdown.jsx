import React, { useState } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";

// Compact multi-select for station filtering — opens as a native-style overlay
// panel (bottom sheet on phones, centered on larger screens) like MobileSelect.
export default function StationFilterDropdown({ t, options, selected, onToggle, onSelectAll, onClearAll }) {
  const [open, setOpen] = useState(false);

  const allSelected = options.length > 0 && options.every((o) => selected.includes(o.key));
  const label = allSelected ? t("all") : `${selected.length}/${options.length}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted"
      >
        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
        {t("stations")} ({label})
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center sm:justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-card rounded-t-2xl sm:rounded-xl border border-border max-h-[70vh] overflow-y-auto pb-safe shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-border sticky top-0 bg-card">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-body">{t("stations")}</p>
              <div className="flex items-center gap-3">
                <button onClick={onSelectAll} className="text-[11px] text-accent hover:underline">{t("all")}</button>
                <button onClick={onClearAll} className="text-[11px] text-muted-foreground hover:underline">{t("cancel")}</button>
              </div>
            </div>
            {options.map((o) => {
              const isSelected = selected.includes(o.key);
              return (
                <button
                  key={o.key}
                  onClick={() => onToggle(o.key)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-body hover:bg-muted text-start ${isSelected ? "text-accent font-medium" : ""}`}
                >
                  <span className="truncate">{o.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-accent shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}