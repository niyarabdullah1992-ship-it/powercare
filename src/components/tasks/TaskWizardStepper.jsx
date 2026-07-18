import React from "react";

export default function TaskWizardStepper({ lang }) {
  const steps = lang === "ar"
    ? ["تفاصيل المهمة", "الإسناد", "الأولوية والمدة", "المراجعة"]
    : ["Task details", "Assignment", "Priority & duration", "Review"];

  return (
    <div className="px-2 pb-4 pt-2" aria-label={lang === "ar" ? "مراحل إنشاء المهمة" : "Task creation steps"}>
      <div className="relative grid grid-cols-4 gap-1">
        <div className="absolute inset-x-[12.5%] top-2 h-px bg-accent/45" />
        {steps.map((step, index) => (
          <div key={step} className="relative z-10 flex min-w-0 flex-col items-center gap-2 text-center">
            <span className={`h-4 w-4 rounded-full border-2 ${index === 0 ? "border-accent bg-accent shadow-sm" : "border-accent/55 bg-secondary"}`} />
            <span className={`text-[10px] font-body leading-tight sm:text-xs ${index === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}