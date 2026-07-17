import React from "react";
import { MANUAL_CHAPTERS } from "@/lib/siteManualContent";

export default function ManualToc() {
  return (
    <nav className="rounded-2xl border border-border bg-card p-5 print:break-after-page">
      <h2 className="font-heading text-2xl font-semibold">فهرس الفصول</h2>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {MANUAL_CHAPTERS.map((item) => <a key={item.id} href={`#${item.id}`} className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">{item.title}</a>)}
      </div>
    </nav>
  );
}