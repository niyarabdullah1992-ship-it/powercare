import React from "react";
import { Building2, Users } from "lucide-react";

export default function LoginTypeSelector({ value, onChange, lang }) {
  const options = [
    { value: "company", icon: Building2, ar: "دخول الشركة", en: "Company login" },
    { value: "employee", icon: Users, ar: "دخول الموظفين", en: "Employee login" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl bg-landing-bg p-1.5" role="tablist">
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
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${selected ? "bg-card text-landing-gold shadow-sm" : "text-muted-foreground hover:text-primary"}`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {lang === "ar" ? option.ar : option.en}
          </button>
        );
      })}
    </div>
  );
}