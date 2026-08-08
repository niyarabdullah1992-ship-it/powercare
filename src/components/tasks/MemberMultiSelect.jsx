import React from "react";
import { Check } from "lucide-react";

// Assign one task to several members at once — or to the whole station team.
export default function MemberMultiSelect({ members, selected, onChange, lang }) {
  const ar = lang === "ar";
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-body">
        {selected.length > 0
          ? `${selected.length} ${ar ? "عضو محدد" : "selected"}`
          : (ar ? "اختر عضواً أو أكثر" : "Select one or more members")}
      </p>
      <div className="flex max-h-52 flex-wrap gap-x-4 gap-y-1 overflow-y-auto">
        {members.length === 0 ? (
          <p className="p-2 text-xs text-muted-foreground font-body">{ar ? "لا يوجد أعضاء في هذه المحطة." : "No members in this station."}</p>
        ) : members.map((m) => {
          const on = selected.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-start text-sm font-body transition ${on ? "text-foreground font-medium" : "text-foreground/80"}`}
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