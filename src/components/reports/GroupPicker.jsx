import React from "react";

// Compact scrollable checkbox list used to build a group of employees
// (Group A / Group B) for the group-vs-group comparison view.
export default function GroupPicker({ label, employees, selected, onToggle, accent = "bg-foreground" }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider px-1">
        {label} <span className="normal-case">({selected.length})</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-40 overflow-y-auto p-1.5 rounded-lg border border-border bg-background">
        {employees.map((e) => {
          const checked = selected.includes(e.id);
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => onToggle(e.id)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-body text-start transition ${checked ? `${accent} text-background` : "hover:bg-muted"}`}
            >
              <span className={`w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center ${checked ? "bg-background border-background" : "border-current"}`}>
                {checked && <span className="w-2 h-2 rounded-[1px] bg-foreground" />}
              </span>
              <span className="truncate">{e.name}</span>
            </button>
          );
        })}
        {employees.length === 0 && <p className="text-xs text-muted-foreground font-body p-2">—</p>}
      </div>
    </div>
  );
}