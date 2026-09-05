import React from "react";

// A single A4-style document sheet with the NiroVera navy/gold framing.
export default function TruePerfPage({ children, footerAr }) {
  return (
    <section className="guide-page relative flex flex-col bg-background px-12 py-10">
      <div className="pointer-events-none absolute inset-4 border border-accent/40" />
      <div className="relative flex-1">{children}</div>
      <div className="relative mt-8 flex items-center justify-between border-t border-accent/30 pt-3 text-[10px] text-muted-foreground">
        <span>NiroVera — True Performance Evaluation</span>
        <span>{footerAr}</span>
      </div>
    </section>
  );
}