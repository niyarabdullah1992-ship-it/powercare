import React, { useState, useRef, useEffect } from "react";
import { Users, ChevronDown, Check } from "lucide-react";

// Collapsible picker for building a group of employees (Group A / Group B) —
// shows just a compact button by default, list appears only on click.
export default function GroupPicker({ label, employees, selected, onToggle, accent = "bg-foreground" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border text-xs font-body hover:bg-muted"
      >
        <span className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          {label} <span className="text-muted-foreground">({selected.length})</span>
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1.5 w-full max-h-56 overflow-y-auto bg-card border border-border rounded-md shadow-xl py-1">
          {employees.map((e) => {
            const checked = selected.includes(e.id);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onToggle(e.id)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-body hover:bg-muted text-start"
              >
                <span className="truncate">{e.name}</span>
                {checked && <Check className={`w-3.5 h-3.5 shrink-0 ${accent === "bg-accent" ? "text-accent" : "text-foreground"}`} />}
              </button>
            );
          })}
          {employees.length === 0 && <p className="text-xs text-muted-foreground font-body px-2.5 py-1.5">—</p>}
        </div>
      )}
    </div>
  );
}