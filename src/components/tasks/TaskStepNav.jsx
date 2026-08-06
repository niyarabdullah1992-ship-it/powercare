import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// أزرار التنقل بين مراحل النموذج — يظهر زر الحفظ في المرحلة الأخيرة فقط.
export default function TaskStepNav({ step, lastStep, setStep, onCancel, lang, dir, submitLabel, submitting }) {
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <button
        type="button"
        onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}
        className="flex items-center gap-1.5 rounded-lg border border-accent/60 bg-secondary/60 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
      >
        <Prev className="h-4 w-4" /> {step === 0 ? (lang === "ar" ? "إلغاء" : "Cancel") : (lang === "ar" ? "السابق" : "Back")}
      </button>
      {step < lastStep ? (
        <button
          type="button"
          onClick={() => setStep(step + 1)}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          {lang === "ar" ? "التالي" : "Next"} <Next className="h-4 w-4" />
        </button>
      ) : (
        <button type="submit" disabled={submitting} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">
          {submitLabel}
        </button>
      )}
    </div>
  );
}