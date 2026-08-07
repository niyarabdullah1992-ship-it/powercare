import React from "react";
import { Building2, Landmark, Users } from "lucide-react";

// ثلاثة مداخل دخول مقسّمة: الشركات · الجهات الحكومية · الأفراد.
export default function LoginTypeSelector({ value, onChange, lang }) {
  const options = [
    { value: "company", icon: Building2, ar: "دخول الشركات", en: "Companies" },
    { value: "gov", icon: Landmark, ar: "دخول الجهات الحكومية", en: "Government" },
    { value: "individual", icon: Users, ar: "دخول الأفراد", en: "Individuals" },
  ];

  return (
    <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-landing-bg p-1.5" role="tablist">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2.5 text-[11px] font-semibold leading-tight transition-colors sm:text-xs ${selected ? "bg-card text-landing-gold shadow-sm" : "text-muted-foreground hover:text-primary"}`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-center">{lang === "ar" ? option.ar : option.en}</span>
          </button>
        );
      })}
    </div>
  );
}