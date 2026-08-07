import React from "react";

// خطوط زمنية للمراحل العصرية للتطبيق.
export default function TruePerfSteps({ steps }) {
  return (
    <div className="relative ps-6">
      <span className="absolute inset-y-2 end-auto start-[7px] w-px bg-accent/40" />
      <div className="space-y-4">
        {steps.items.map((step) => (
          <div key={step.titleAr} className="relative">
            <span className="absolute -start-[23px] top-2 h-3 w-3 rounded-full border-2 border-accent bg-background" />
            <div className="rounded-lg border border-border bg-card px-5 py-3">
              <p className="text-[10px] uppercase tracking-widest text-accent">{step.phaseAr}</p>
              <p className="mt-1 font-heading text-lg font-semibold text-primary">{step.titleAr}</p>
              <p className="mt-1 text-[12px] leading-6 text-muted-foreground">{step.textAr}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}