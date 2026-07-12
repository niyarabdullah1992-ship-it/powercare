import React from "react";

// One collapsible-free, simple instruction card: icon + title + numbered steps.
export default function HelpSection({ icon: Icon, title, steps }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card">
      <h2 className="font-heading text-lg font-semibold flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-accent" />
        </span>
        {title}
      </h2>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm font-body text-muted-foreground">
            <span className="w-5 h-5 rounded-full bg-muted text-foreground text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}