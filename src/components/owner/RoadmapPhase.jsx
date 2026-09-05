import React from "react";
import { CheckCircle2, Clock3 } from "lucide-react";

const styles = {
  completed: "border-primary/20 bg-primary/5 text-primary",
  current: "border-accent/45 bg-accent/15 text-accent-foreground",
  future: "border-border bg-muted text-muted-foreground",
};

export default function RoadmapPhase({ data }) {
  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-accent">{data.phase}</p><h3 className="mt-1 font-heading text-2xl font-semibold text-card-foreground">{data.title}</h3></div>
        <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${styles[data.tone]}`}><Clock3 className="h-3.5 w-3.5" />{data.period}</span>
      </div>
      <div className="mt-5 space-y-3">
        {data.items.map((item) => <div key={item} className="flex items-start gap-2.5 text-sm leading-6 text-foreground/70"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent" /><span>{item}</span></div>)}
      </div>
    </article>
  );
}