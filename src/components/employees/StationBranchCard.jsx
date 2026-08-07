import React from "react";
import { Building2, Users } from "lucide-react";

// بطاقة فرع/محطة — الضغط عليها يعرض موظفيها.
export default function StationBranchCard({ name, location, count, onClick, ar }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-5 text-start hover:border-accent/60">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10">
        <Building2 className="h-5 w-5 text-accent" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-heading text-sm font-semibold">{name}</span>
        {location && <span className="block truncate text-xs text-muted-foreground">{location}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <Users className="h-3.5 w-3.5" /> {count} {ar ? "موظف" : ""}
      </span>
    </button>
  );
}