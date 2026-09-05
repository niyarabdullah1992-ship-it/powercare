import React from "react";
import { Search, Settings2, PlayCircle, LineChart, Flag, Users, ShieldCheck, CheckCircle2 } from "lucide-react";

const icons = [Search, Settings2, PlayCircle, LineChart, Flag, Users, ShieldCheck, CheckCircle2];

export default function AcwaStepsVisual({ data }) {
  return <div className="relative flex h-full items-stretch gap-2">
    <div className="absolute left-8 right-8 top-8 h-px bg-accent/40" />
    {data.items.map((item, index) => {
      const Icon = icons[index % icons.length];
      return <div key={index} className="relative z-10 flex flex-1 flex-col items-center text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-accent bg-card text-accent"><Icon className="h-4 w-4" /></span>
        <strong className="mt-3 text-[10px]">{String(index + 1).padStart(2, "0")} · {item.title}</strong>
        <span dir="rtl" className="mt-1 text-[8px] font-semibold">{item.titleAr}</span>
        <p className="mt-2 text-[8px] leading-4 text-muted-foreground">{item.detail}</p>
      </div>;
    })}
  </div>;
}