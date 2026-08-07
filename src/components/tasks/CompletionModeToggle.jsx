import React from "react";

export default function CompletionModeToggle({ value, onChange, lang, name = "completionMode" }) {
  const options = [
    { value: "onsite", label: lang === "ar" ? "🏢 حضوري" : "🏢 On-site" },
    { value: "remote", label: lang === "ar" ? "🌐 عن بُعد" : "🌐 Remote" },
  ];

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
        {lang === "ar" ? "نوع الإنجاز" : "Completion mode"}
      </p>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-body transition ${value === option.value ? "border-accent bg-accent text-accent-foreground" : "border-border bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}