import React from "react";

// The one line that turns the tree into an audit tool: what template the node
// carries, how many sections it was granted, and whether it left its template.
export default function NodeAccessSummary({ templateName, granted, customized, ar }) {
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1 text-[9px] text-muted-foreground">
      <span className="rounded-full border border-border bg-muted/50 px-1.5 py-px">{templateName || (ar ? "بدون قالب" : "No template")}</span>
      <span className="rounded-full border border-accent/30 bg-accent/10 px-1.5 py-px text-accent-text">{granted} {ar ? "أقسام ممنوحة" : "sections"}</span>
      {customized && <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-px text-amber-700">{ar ? "معدَّل" : "Customized"}</span>}
    </span>
  );
}