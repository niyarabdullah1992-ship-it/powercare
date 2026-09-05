import React from "react";
import { Image } from "@/components/ui/image";

export default function ProjectGuideSection({ section, index }) {
  const number = String(index + 1).padStart(2, "0");
  const imageFirst = index % 2 === 0;
  return <article className="guide-page flex flex-col bg-background p-12 text-foreground">
    <header className="mb-7 flex items-end justify-between border-b border-accent/50 pb-5">
      <div><p className="font-mono text-[9px] tracking-[.24em] text-accent">POWERCARE PLATFORM • SECTION {number}</p><h2 className="mt-2 max-w-xl font-heading text-3xl font-bold leading-tight">{section.titleAr}</h2><p dir="ltr" className="mt-2 text-sm font-semibold text-muted-foreground">{section.titleEn}</p></div>
      <span className="font-heading text-7xl leading-none text-accent/75">{number}</span>
    </header>
    <div className={`mb-8 grid grid-cols-12 gap-8 ${imageFirst ? "" : "direction-ltr"}`}>
      <Image src={section.image} alt={section.titleEn} fittingType="fill" className={`h-80 w-full border border-border ${imageFirst ? "col-span-8" : "col-span-7 col-start-6"}`} />
      <div className={`flex flex-col justify-end border-t-4 border-accent bg-secondary p-6 ${imageFirst ? "col-span-4" : "col-span-5 row-start-1"}`}>
        <p className="font-heading text-2xl font-bold leading-9">{section.titleAr}</p><p dir="ltr" className="mt-3 text-xs leading-6 text-muted-foreground">{section.titleEn}</p><div className="mt-8 h-px w-14 bg-accent" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-10"><div className="space-y-4">{section.bodyAr.map((text) => <p key={text} className="text-justify text-[13px] leading-7">{text}</p>)}</div><div dir="ltr" className="space-y-4 border-l border-border pl-8">{section.bodyEn.map((text) => <p key={text} className="text-justify text-[12px] leading-6 text-muted-foreground">{text}</p>)}</div></div>
    <footer className="mt-auto flex justify-between border-t border-border pt-4 font-mono text-[8px] tracking-[.15em] text-muted-foreground"><span>POWERCARE • EXECUTIVE GUIDE</span><span>{number}</span></footer>
  </article>;
}