import React from "react";
import { ChevronDown, FileText } from "lucide-react";

export default function ReportPanelToggle({ open, onClick, label }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-accent/35 bg-card px-4 py-2 text-sm font-body text-foreground shadow-sm hover:border-accent/70 hover:bg-muted/40"
    >
      <FileText className="h-5 w-5 shrink-0 text-accent" />
      <span className="truncate">{label}</span>
      <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );
}