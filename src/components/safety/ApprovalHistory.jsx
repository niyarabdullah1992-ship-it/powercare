import React, { useState } from "react";
import { ChevronDown, BadgeCheck } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormat";

// Collapsible per-station approval log — every approval is saved and listed here.
export default function ApprovalHistory({ log, lang }) {
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);
  if (!log || log.length === 0) return null;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] font-body text-muted-foreground hover:text-foreground transition"
      >
        <BadgeCheck className="w-3 h-3 text-emerald-600" />
        {ar ? `سجل الاعتمادات (${log.length})` : `Approval history (${log.length})`}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
          {log.map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-2 rounded-md bg-muted/60 px-2.5 py-1.5">
              <span className="text-[11px] font-body font-semibold">{a.by}</span>
              <span className="text-[10px] text-muted-foreground font-body">{formatDateTime(a.at, lang)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}