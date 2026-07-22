import React from "react";
import { LayoutTemplate } from "lucide-react";

export default function TemplatesHeader({ ar }) {
  return <div className="rounded-xl border border-accent/30 bg-primary p-6 text-primary-foreground"><div className="flex items-center gap-3"><LayoutTemplate className="h-7 w-7 text-landing-gold-light" /><div><p className="text-xs uppercase tracking-widest text-landing-gold-light">PowerCare</p><h1 className="font-heading text-3xl font-semibold">{ar ? "مكتبة القوالب" : "Template Library"}</h1></div></div><p className="mt-3 max-w-2xl text-sm text-primary-foreground/75">{ar ? "قوالب الموارد البشرية والإدارة متاحة لجميع أقسام المنصة، جاهزة للتعبئة والطباعة أو الحفظ بصيغة PDF." : "HR and company templates available across the platform, ready to fill, print or save as PDF."}</p></div>;
}