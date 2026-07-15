import React, { useState } from "react";
import { ChevronDown, FolderOpen } from "lucide-react";
import { SCOPE_BADGES } from "@/lib/taskTimeScope";

// One collapsible period folder inside the smart archive (e.g. "Q2 · 2026").
export default function ArchivePeriodGroup({ group, ar, renderTask }) {
  const [open, setOpen] = useState(false);
  const badge = SCOPE_BADGES[group.scope.type];
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-muted transition-colors text-start"
      >
        <span className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <FolderOpen className="w-4 h-4" />
        </span>
        <p className="text-sm font-medium font-body flex-1 min-w-0 truncate">{group.label}</p>
        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-body shrink-0 ${badge.cls}`}>{ar ? badge.ar : badge.en}</span>
        <span className="text-[11px] text-muted-foreground font-body shrink-0">{group.tasks.length}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="p-3 pt-0 space-y-3 border-t border-border/60">
          <div className="pt-3 space-y-3">{group.tasks.map((tg) => renderTask(tg))}</div>
        </div>
      )}
    </div>
  );
}