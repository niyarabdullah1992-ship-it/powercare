import React from "react";
import { Image } from "@/components/ui/image";

export default function ProjectGuideIntro({ philosophy, sections, image }) {
  return <>
    <article className="guide-page bg-background p-12 text-foreground">
      <div className="mb-8 flex items-end justify-between border-b border-accent/50 pb-5"><div><p className="font-mono text-[9px] tracking-[.25em] text-accent">PROJECT PHILOSOPHY</p><h2 className="mt-2 font-heading text-3xl font-bold">{philosophy.titleAr}</h2><p dir="ltr" className="mt-2 text-sm text-muted-foreground">{philosophy.titleEn}</p></div><span className="font-heading text-7xl text-accent/70">01</span></div>
      <Image src={image} alt="NiroVera command center" fittingType="fill" className="mb-8 h-72 w-full border border-border" />
      <div className="grid grid-cols-2 gap-10"><div className="space-y-4">{philosophy.bodyAr.map((text) => <p key={text} className="text-justify text-[13px] leading-7">{text}</p>)}</div><div dir="ltr" className="space-y-4 border-l border-border pl-8">{philosophy.bodyEn.map((text) => <p key={text} className="text-justify text-[12px] leading-6 text-muted-foreground">{text}</p>)}</div></div>
    </article>
    <article className="guide-page flex flex-col bg-secondary p-12 text-foreground">
      <div className="mb-8 border-b border-accent/50 pb-5"><p className="font-mono text-[9px] tracking-[.25em] text-accent">EDITORIAL INDEX</p><h2 className="mt-2 font-heading text-4xl font-bold">المحتويات <span dir="ltr" className="text-2xl text-muted-foreground">— Contents</span></h2></div>
      <ol className="grid flex-1 grid-cols-2 grid-rows-10 gap-x-10 gap-y-3">{sections.map((section, index) => <li key={section.titleEn} className="flex items-center gap-3 border-b border-border py-3"><span className="font-heading text-2xl text-accent">{String(index + 1).padStart(2, "0")}</span><span><strong className="block text-sm">{section.titleAr}</strong><small dir="ltr" className="text-[10px] text-muted-foreground">{section.titleEn}</small></span></li>)}</ol>
    </article>
  </>;
}