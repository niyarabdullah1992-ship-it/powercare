import React from "react";

export default function CompletionModeToggle({ value, onChange, lang, name = "completionMode" }) {
  const options = [
    { value: "onsite", label: lang === "ar" ? "حضوري" : "On-site" },
    { value: "remote", label: lang === "ar" ? "عن بُعد" : "Remote" },
  ];

  return (
    <div>
      <p className="mb-2 text-xs font-semibold">
        {lang === "ar" ? "نمط الإنجاز" : "Completion mode"}
      </p>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-body transition ${value === option.value ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}