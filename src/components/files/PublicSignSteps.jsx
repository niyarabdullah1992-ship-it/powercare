import React from "react";

export default function PublicSignSteps({ ar, current = 2 }) {
  const steps = ar ? ["مراجعة المستند", "إضافة التوقيع", "التحقق والإرسال"] : ["Review document", "Add signature", "Verify & submit"];
  return (
    <div className="mb-6 rounded-xl border border-border bg-card px-4 py-4 shadow-sm sm:px-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {steps.map((label, index) => {
          const number = index + 1;
          const active = number === current;
          const complete = number < current;
          return (
            <div key={label} className="min-w-0">
              <div className={`mb-2 h-1 rounded-full ${active || complete ? "bg-accent" : "bg-muted"}`} />
              <p className={`truncate text-[10px] sm:text-xs ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{number}. {label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}