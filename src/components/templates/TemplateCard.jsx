import React from "react";
import { FileText, Users } from "lucide-react";

export default function TemplateCard({ template, ar, onUse }) {
  const HRIcon = template.category === "hr" ? Users : FileText;
  return <button onClick={() => onUse(template)} className="rounded-xl border border-border bg-card p-5 text-start hover:border-accent">
    <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent"><HRIcon className="h-5 w-5" /></span>
    <h2 className="font-heading text-xl font-semibold">{ar ? template.ar : template.en}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{ar ? template.descAr : template.descEn}</p>
    <span className="mt-4 inline-block text-xs font-semibold text-accent">{ar ? "استخدام القالب" : "Use template"}</span>
  </button>;
}