import React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { AUDIT_SECTIONS } from "@/lib/siteManualContent";

export default function AuditSummary() {
  return (
    <section className="manual-chapter rounded-2xl border border-border bg-card p-5 md:p-7">
      <h2 className="font-heading text-3xl font-semibold">ملخص التدقيق النهائي</h2>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">مراجعة للأمن والصلاحيات، منطق الأعمال والبيانات، الواجهات والأداء، مع توضيح ما يحتاج متابعة تشغيلية.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">{AUDIT_SECTIONS.map((section) => { const pending = section.status !== "مراجع"; const Icon = pending ? AlertTriangle : CheckCircle2; return <article key={section.title} className="rounded-xl border border-border p-4"><div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${pending ? "text-amber-600" : "text-emerald-600"}`} /><h3 className="font-semibold">{section.title}</h3><span className="ms-auto text-[10px] text-muted-foreground">{section.status}</span></div><ul className="mt-3 list-disc space-y-2 ps-5 text-xs leading-6 text-muted-foreground">{section.items.map((item) => <li key={item}>{item}</li>)}</ul></article>; })}</div>
    </section>
  );
}