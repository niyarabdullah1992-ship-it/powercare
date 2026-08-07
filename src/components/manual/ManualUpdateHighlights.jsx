import React from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function ManualUpdateHighlights({ items = [], lang }) {
  if (!items.length) return null;
  return (
    <section className="rounded-2xl border border-accent/25 bg-card p-5 shadow-soft md:p-7">
      <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold"><Sparkles className="h-5 w-5 text-accent" />{lang === "ar" ? "ما الجديد في هذا الإصدار؟" : "What is new in this release?"}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{items.map((item) => <div key={item} className="flex gap-3 rounded-xl border border-border bg-background/60 p-4 text-sm leading-7"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent" /><span>{item}</span></div>)}</div>
    </section>
  );
}