import React from "react";
import { ChevronDown, FileText } from "lucide-react";

export default function ReportPanelToggle({ open, onClick, label }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-body text-foreground shadow-sm hover:border-accent/60 hover:bg-muted/40"
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-accent" />
      <span>{label}</span>
      <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );
}