import React from "react";
import { ShieldCheck, Sparkles } from "lucide-react";

export default function RoadmapScorecard({ ar }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-foreground">{ar ? "جاهزية التشغيل" : "Operational readiness"}</span>
          <ShieldCheck className="h-5 w-5 text-accent" />
        </div>
        <div className="flex items-end gap-2"><strong className="font-heading text-5xl text-card-foreground">8.5</strong><span className="pb-1 text-sm text-muted-foreground">/ 10</span></div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{ar ? "القدرات الأساسية مكتملة، والتركيز الحالي على الموثوقية والتشغيل الفعلي." : "Core capabilities are delivered; the current focus is reliability and live operations."}</p>
      </div>
      <div className="rounded-xl border border-accent/35 bg-primary p-5 text-primary-foreground shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold text-accent">{ar ? "شمولية المنصة" : "Platform coverage"}</span>
          <Sparkles className="h-5 w-5 text-accent" />
        </div>
        <div className="flex items-end gap-2"><strong className="font-heading text-5xl">9</strong><span className="pb-1 text-sm text-primary-foreground/50">/ 10</span></div>
        <p className="mt-3 text-sm leading-6 text-primary-foreground/65">{ar ? "تغطية مؤسسية واسعة تشمل التشغيل والموارد والمالية والأمن والمستندات." : "Broad enterprise coverage across operations, people, finance, security, and documents."}</p>
      </div>
    </div>
  );
}