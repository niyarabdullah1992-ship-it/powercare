import React from "react";
import { Download, ShieldCheck } from "lucide-react";
import { MANUAL_META } from "@/lib/siteManualContent";

export default function ManualHeader() {
  return (
    <header className="rounded-3xl bg-primary p-6 text-primary-foreground md:p-10 print:rounded-none">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-accent"><ShieldCheck className="h-4 w-4" /> POWERCARE OPERATIONS MANUAL</div>
          <h1 className="font-heading text-3xl font-semibold md:text-5xl">{MANUAL_META.title}</h1>
          <p className="mt-3 text-sm leading-7 text-primary-foreground/70">{MANUAL_META.subtitle}</p>
          <p className="mt-4 rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-3 text-xs leading-6">{MANUAL_META.notice}</p>
        </div>
        <button onClick={() => window.print()} className="no-print flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground"><Download className="h-4 w-4" /> تنزيل PDF</button>
      </div>
    </header>
  );
}