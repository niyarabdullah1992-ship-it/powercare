import React from "react";
import Logo from "@/components/Logo";

export default function SapComparisonPdfPage({ number, eyebrow, title, children }) {
  return (
    <article data-pdf-page dir="rtl" className="relative mx-auto flex h-[1123px] w-[794px] shrink-0 flex-col overflow-hidden bg-background px-11 py-10 text-foreground shadow-elevated">
      <div className="absolute inset-x-0 top-0 h-2 bg-accent" />
      <header className="flex items-center justify-between border-b border-accent/30 pb-5"><div className="flex items-center gap-3"><Logo size={38} /><div><p className="font-heading text-lg font-bold">NiroVera</p><p className="text-[8px] tracking-[.2em] text-muted-foreground">SAP PAIN-TO-SOLUTION</p></div></div><span className="font-mono text-xs text-accent">{number} / 04</span></header>
      <div className="py-7 text-right"><p className="mb-3 font-mono text-[10px] tracking-[.18em] text-accent">{eyebrow}</p><h2 className="font-heading text-4xl font-bold">{title}</h2></div>
      <div className="flex-1">{children}</div>
      <footer className="mt-auto flex items-center justify-between border-t border-accent/25 pt-4 text-[9px] text-muted-foreground"><span>مقارنة تنفيذية • أغسطس 2026</span><span dir="ltr">POWERCARE • SAP ALTERNATIVE</span></footer>
    </article>
  );
}