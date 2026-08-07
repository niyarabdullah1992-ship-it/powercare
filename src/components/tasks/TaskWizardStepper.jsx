import React from "react";
import { Check } from "lucide-react";

// شريط مراحل تفاعلي: يبرز المرحلة الحالية ويسمح بالتنقل بينها.
export default function TaskWizardStepper({ lang, steps, active = 0, onSelect, canSelect }) {
  const labels = steps || (lang === "ar"
    ? ["تفاصيل المهمة", "الإسناد", "الأولوية والمدة", "المراجعة"]
    : ["Task details", "Assignment", "Priority & duration", "Review"]);

  return (
    <div className="px-2 pb-4 pt-2" aria-label={lang === "ar" ? "مراحل إنشاء المهمة" : "Task creation steps"}>
      <div className="relative flex gap-1">
        <div className="absolute inset-x-[12%] top-2 h-px bg-accent/45" />
        {labels.map((step, index) => {
          const done = index < active;
          const current = index === active;
          return (
            <button
              key={step}
              type="button"
              onClick={() => { if (canSelect && canSelect(index) === false) return; onSelect?.(index); }}
              className="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-2 text-center"
            >
              <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${current ? "border-accent bg-accent shadow-sm" : done ? "border-accent bg-accent/80" : "border-accent/55 bg-secondary"}`}>
                {done && <Check className="h-2.5 w-2.5 text-accent-foreground" strokeWidth={3} />}
              </span>
              <span className={`text-[10px] font-body leading-tight sm:text-xs ${current ? "font-semibold text-foreground" : done ? "text-foreground/70" : "text-muted-foreground"}`}>
                {step}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}