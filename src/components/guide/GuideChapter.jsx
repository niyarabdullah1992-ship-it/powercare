import React from "react";

export default function GuideChapter({ index, chapter, stepsLabel }) {
  return (
    <section id={chapter.id} className="scroll-mt-24 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          {index}
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold text-foreground">{chapter.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{chapter.intro}</p>
        </div>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{stepsLabel}</p>
      <ol className="mt-2 space-y-2">
        {chapter.steps.map((step, i) => (
          <li key={i} className="flex gap-2 text-sm text-foreground">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}