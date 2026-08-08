import React from "react";
import { Check } from "lucide-react";

// Assign one task to several members at once — the list is always visible.
export default function MemberMultiSelect({ members, selected, onChange, lang }) {
  const ar = lang === "ar";
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  if (members.length === 0) {
    return <p className="text-xs text-muted-foreground font-body">{ar ? "لا يوجد أعضاء في هذه المحطة." : "No members in this station."}</p>;
  }

  return (
    <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-input bg-card p-1.5">
      {members.map((m) => {
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
  );
}