import React from "react";
import { EFFORT_WEIGHT_LABELS } from "@/lib/effortWeights";

// وزن الجهد — الوزن المقترح من المسمى الوظيفي يظهر مضيئاً بدل ×١ الافتراضي دائماً.
export default function EffortWeightPicker({ value, onChange, suggested, lang }) {
  const ar = lang === "ar";
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((w) => {
          const active = value === w;
          const isSuggested = suggested === w && !active;
          return (
            <button
              key={w}
              type="button"
              onClick={() => onChange(w)}
              title={EFFORT_WEIGHT_LABELS[w][ar ? "ar" : "en"]}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-body transition ${active ? "border-foreground bg-foreground text-background" : isSuggested ? "border-accent bg-accent/15 text-accent-text" : "border-border hover:bg-muted"}`}
            >
              ×{w}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] font-body text-muted-foreground">
        {suggested
          ? (ar ? `الوزن ×${suggested} مقترح من المسمى الوظيفي — يمكنك تعديله قبل بدء العمل.` : `Weight ×${suggested} suggested from the job title — you can change it before work starts.`)
          : (ar ? "يُحدَّد الوزن قبل بدء العمل، ولا تُمنح النقاط إلا بعد اعتماد الإثبات." : "Weight is set before work starts; points are granted only after evidence approval.")}
      </p>
    </div>
  );
}