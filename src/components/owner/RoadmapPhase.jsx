import React from "react";
import { CheckCircle2, Clock3 } from "lucide-react";

const styles = {
  urgent: "border-red-200 bg-red-50/60 text-red-700",
  growth: "border-amber-200 bg-amber-50/60 text-amber-700",
  future: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
};

export default function RoadmapPhase({ data }) {
  return (
    <article className="rounded-2xl border border-[#3a2f22]/10 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-landing-gold">{data.phase}</p><h3 className="mt-1 font-heading text-2xl font-semibold text-[#3a2f22]">{data.title}</h3></div>
        <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${styles[data.tone]}`}><Clock3 className="h-3.5 w-3.5" />{data.period}</span>
      </div>
      <div className="mt-5 space-y-3">
        {data.items.map((item) => <div key={item} className="flex items-start gap-2.5 text-sm leading-6 text-[#3a2f22]/70"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-landing-gold" /><span>{item}</span></div>)}
      </div>
    </article>
  );
}