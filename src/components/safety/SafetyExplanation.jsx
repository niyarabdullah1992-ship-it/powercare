import React from "react";
import { BookOpenCheck } from "lucide-react";

export default function SafetyExplanation({ ar }) {
  const steps = ar
    ? ["اختر المحطة", "سجّل الخطر أو الحادث", "قيّم المخاطر وأكمل قوائم التحقق", "تابع المؤشرات وتصاريح العمل", "راجع البيانات واعتمدها ثم صدّر التقرير"]
    : ["Choose a station", "Log a hazard or incident", "Assess risks and complete checklists", "Track KPIs and work permits", "Review, approve, and export the report"];

  return (
    <section className="rounded-2xl border border-accent/20 bg-accent/10 p-5">
      <div className="flex items-start gap-3">
        <BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={1.75} />
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold">{ar ? "كيف يعمل قسم السلامة HSE؟" : "How does the HSE section work?"}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground font-body">
            {ar ? "يُستخدم قسم الصحة والسلامة والبيئة لمتابعة سلامة كل محطة، وتسجيل المخاطر والحوادث، واتخاذ الإجراءات اللازمة قبل اعتماد البيانات في التقارير." : "The Health, Safety and Environment section tracks each station, records hazards and incidents, and verifies safety data before reporting."}
          </p>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => (
              <li key={step} className="flex items-start gap-2 rounded-xl border border-border/70 bg-card p-3 text-xs font-body">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold">{index + 1}</span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}