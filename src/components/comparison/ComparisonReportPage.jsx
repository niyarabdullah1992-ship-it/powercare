import React from "react";
import Logo from "@/components/Logo";

export default function ComparisonReportPage({ page, total }) {
  return <article data-pdf-page dir="rtl" className="relative mx-auto flex h-[1123px] w-[794px] shrink-0 flex-col overflow-hidden bg-background px-11 py-10 text-foreground shadow-elevated">
    <div className="absolute inset-x-0 top-0 h-2 bg-accent" />
    <header className="flex items-center justify-between border-b border-accent/30 pb-5">
      <div className="flex items-center gap-3"><Logo size={38} /><div><p className="font-heading text-lg font-bold">PowerCare</p><p className="text-[8px] tracking-[.2em] text-muted-foreground">INDEPENDENT COMPARISON</p></div></div>
      <span dir="ltr" className="font-mono text-xs text-accent">{page.number} / {String(total).padStart(2, "0")}</span>
    </header>
    <div className="py-7 text-right"><p dir="ltr" className="mb-3 text-right font-mono text-[10px] tracking-[.18em] text-accent">{page.eyebrow}</p><h1 className="font-heading text-4xl font-bold">{page.title}</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">{page.intro}</p></div>
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid grid-cols-[1.05fr_1.55fr_1.55fr_.9fr] bg-primary px-3 py-3 text-[10px] font-bold text-primary-foreground"><span>المعيار<br />Criterion</span><span>بور كير<br />PowerCare</span><span>ساب التقليدي<br />Traditional SAP</span><span>النتيجة<br />Verdict</span></div>
      {page.rows.map((row, index) => <div key={`${page.number}-${index}`} className="grid grid-cols-[1.05fr_1.55fr_1.55fr_.9fr] whitespace-pre-line border-t border-border px-3 py-2.5 text-[11px] leading-5"><strong>{row[0]}</strong><span>{row[1]}</span><span className="text-muted-foreground">{row[2]}</span><span className="font-semibold text-accent-foreground">{row[3]}</span></div>)}
    </div>
    {page.note && <p className="mt-5 rounded-md border border-accent/35 bg-accent/10 p-4 text-xs leading-6">{page.note}</p>}
    <footer className="mt-auto flex items-center justify-between border-t border-accent/25 pt-4 text-[9px] text-muted-foreground"><span>تقييم نوعي مستقل • يوليو 2026</span><span dir="ltr">POWERCARE • SAP COMPARISON</span></footer>
  </article>;
}