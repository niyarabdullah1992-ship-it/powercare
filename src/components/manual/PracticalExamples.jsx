import React from "react";
import { UserRound } from "lucide-react";

export default function PracticalExamples({ examples = [] }) {
  if (!examples.length) return null;
  return <div className="mt-6"><h3 className="mb-3 text-sm font-bold text-foreground">أمثلة عملية</h3><div className="grid gap-3 lg:grid-cols-2">
    {examples.map((example) => <article key={example.title} className="rounded-xl border border-accent/20 bg-accent/5 p-4">
      <div className="flex items-center gap-2 text-accent"><UserRound className="h-4 w-4" /><h4 className="text-sm font-bold">{example.title}</h4></div>
      <p className="mt-2 text-sm leading-7 text-foreground/80">{example.scenario}</p>
      <ol className="mt-2 list-decimal space-y-1 ps-5 text-xs leading-6 text-muted-foreground">{example.steps.map((step) => <li key={step}>{step}</li>)}</ol>
    </article>)}
  </div></div>;
}