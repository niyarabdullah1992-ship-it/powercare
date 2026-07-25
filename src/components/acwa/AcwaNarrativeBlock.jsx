import React from "react";

export default function AcwaNarrativeBlock({ sections = [] }) {
  if (!sections.length) return null;
  return <div className="mt-4 grid grid-cols-2 gap-8 border-t border-border pt-4">
    <div dir="rtl" className="space-y-3 text-right">
      {sections.map((section, index) => <div key={index}><h3 className="mb-1 text-[10px] font-bold text-accent">{section.titleAr}</h3><p className="text-[9px] leading-[1.55] text-foreground/80">{section.textAr}</p></div>)}
    </div>
    <div className="space-y-3">
      {sections.map((section, index) => <div key={index}><h3 className="mb-1 text-[10px] font-bold text-accent">{section.titleEn}</h3><p className="text-[9px] leading-[1.55] text-foreground/80">{section.textEn}</p></div>)}
    </div>
  </div>;
}