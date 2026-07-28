import React from "react";
import { ChevronDown, FileText } from "lucide-react";

export default function ReportPanelToggle({ open, onClick, label }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className="inline-flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-base font-body text-foreground shadow-sm hover:border-accent/60 hover:bg-muted/40"
    >
      <FileText className="h-6 w-6 shrink-0 text-accent" />
      <span>{label}</span>
      <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );
}