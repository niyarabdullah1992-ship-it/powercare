import React from "react";
import { ShieldCheck } from "lucide-react";
import ProfileBulletGrid from "@/components/profile/ProfileBulletGrid";
import AcwaPageVisual from "@/components/acwa/AcwaPageVisual";
import AcwaNarrativeBlock from "@/components/acwa/AcwaNarrativeBlock";

export default function AcwaDocumentPage({ page, total, documentType }) {
  return <article data-pdf-page className="relative mx-auto flex h-[1123px] w-[794px] shrink-0 flex-col overflow-hidden bg-background text-foreground shadow-elevated">
    <div className="h-3 bg-accent" />
    <header className="flex items-center justify-between border-b border-border px-12 py-7">
      <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-primary text-accent"><ShieldCheck className="h-5 w-5" /></span><div><p className="font-heading text-xl font-bold">PowerCare</p><p className="font-mono text-[8px] tracking-[.2em] text-muted-foreground">PROPOSAL FOR ACWA POWER</p></div></div>
      <div className="text-right"><p className="font-mono text-[9px] text-accent">{page.number} / {String(total).padStart(2, "0")}</p><p className="mt-1 text-[8px] text-muted-foreground">{documentType}</p></div>
    </header>
    <div className="relative overflow-hidden bg-primary px-12 py-12 text-primary-foreground">
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-accent/25" />
      <p className="mb-5 font-mono text-[10px] tracking-[.24em] text-accent">{page.eyebrow}</p>
      <div className="grid grid-cols-2 gap-10"><h1 dir="rtl" className="text-right font-heading text-4xl font-bold leading-tight">{page.titleAr}</h1><h2 className="font-heading text-4xl font-bold leading-tight">{page.titleEn}</h2></div>
    </div>
    <AcwaPageVisual page={page} />
    <div className="flex flex-1 flex-col px-12 py-6">
      <div className="grid grid-cols-2 gap-10"><p dir="rtl" className="text-right text-[12px] font-semibold leading-5 text-muted-foreground">{page.summaryAr}</p><p className="text-[11px] font-semibold leading-5 text-muted-foreground">{page.summaryEn}</p></div>
      <AcwaNarrativeBlock sections={page.narrative} />
      {!!page.bulletsAr.length && <div className="mt-4"><ProfileBulletGrid ar={page.bulletsAr} en={page.bulletsEn} /></div>}
      {(page.noteAr || page.noteEn) && <div className="mt-5 grid grid-cols-2 gap-8 rounded-xl border border-accent/30 bg-secondary p-4 text-[10px] leading-5"><p dir="rtl" className="text-right">{page.noteAr}</p><p>{page.noteEn}</p></div>}
      <footer className="mt-auto flex items-center justify-between border-t border-border pt-4 font-mono text-[8px] tracking-[.12em] text-muted-foreground"><span>CONFIDENTIAL • FOR DISCUSSION</span><span>POWERCARE • 2026</span></footer>
    </div>
  </article>;
}