import React from "react";

export default function PublicSignSteps({ ar, current = 2 }) {
  const steps = ar ? ["مراجعة المستند", "تعبئة الحقول والتوقيع", "التحقق والإرسال"] : ["Review document", "Complete fields & sign", "Verify & submit"];
  return (
    <div className="mb-5 rounded-3xl border border-border bg-card p-4 shadow-elevated sm:p-5">
      <div className="grid grid-cols-3">
        {steps.map((label, index) => {
          const number = index + 1;
          const reached = number <= current;
          return (
            <div key={label} className="relative flex flex-col items-center text-center">
              {index < 2 && <span className={`absolute top-4 h-px w-[calc(100%-2.5rem)] ${ar ? "right-[calc(50%+1.25rem)]" : "left-[calc(50%+1.25rem)]"} ${number < current ? "bg-accent" : "bg-border"}`} />}
              <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${reached ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{number}</span>
              <span className={`mt-2 text-[10px] sm:text-xs ${number === current ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}