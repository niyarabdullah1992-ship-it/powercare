import React from "react";
import { BadgeDollarSign, Clock3, Code2, Languages, Workflow } from "lucide-react";

const icons = { cost: BadgeDollarSign, time: Clock3, complexity: Workflow, code: Code2, local: Languages };

export default function SapPainPointCard({ item }) {
  const Icon = icons[item.icon] || Workflow;
  return (
    <article className="grid overflow-hidden rounded-lg border border-border bg-card md:grid-cols-2">
      <div className="border-b border-red-200 bg-red-50 p-5 text-right md:border-b-0 md:border-l">
        <div className="mb-3 flex items-center justify-between"><span className="font-mono text-xs text-red-700">SAP • {item.number}</span><Icon className="h-5 w-5 text-red-700" /></div>
        <h3 className="font-heading text-xl font-bold text-primary">{item.title}</h3>
        <p className="mt-2 text-xs leading-6 text-red-950/70">{item.pain}</p>
      </div>
      <div className="bg-emerald-50/70 p-5 text-right">
        <p className="text-[10px] font-bold tracking-[.16em] text-emerald-800">الحل في POWERCARE</p>
        <p className="mt-3 text-sm font-semibold leading-7 text-primary">{item.solution}</p>
      </div>
    </article>
  );
}