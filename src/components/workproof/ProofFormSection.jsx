import React from "react";

// A named group inside the work-order card: eyebrow code, Arabic title, side note.
export default function ProofFormSection({ eyebrow, title, note, children }) {
  return (
    <section className="space-y-3 border-t border-border/70 pt-4 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h3 className="font-heading text-base font-semibold">{title}</h3>
          {eyebrow && <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-text">{eyebrow}</span>}
        </div>
        {note && <span className="text-[11px] text-muted-foreground font-body">{note}</span>}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, required, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[11px] text-muted-foreground font-body">
        {label}{required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function StageStrip({ steps, activeIndex }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          {index > 0 && <span className="h-px flex-1 bg-border" />}
          <span
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-body ${
              index === activeIndex
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-muted/40 text-muted-foreground"
            }`}
          >
            {step}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}