import React, { useState } from "react";
import { Check, ChevronDown, Users } from "lucide-react";

// Assign one task to several members at once — collapsed behind a single button.
export default function MemberMultiSelect({ members, selected, onChange, lang }) {
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const label = selected.length > 0
    ? `${selected.length} ${ar ? "عضو محدد" : "selected"}`
    : (ar ? "اختر الأعضاء" : "Select members");

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 py-2.5 text-sm font-body"
      >
        <span className="flex items-center gap-2"><Users className="h-4 w-4 text-accent" />{label}</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-input bg-card p-1.5">
          {members.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground font-body">{ar ? "لا يوجد أعضاء في هذه المحطة." : "No members in this station."}</p>
          ) : members.map((m) => {
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
      )}
    </div>
  );
}