import React from "react";
import { Check } from "lucide-react";

export default function MultiSignStepper({ step, labels, ar }) {
  return (
    <div className="mb-10 flex items-start" dir={ar ? "rtl" : "ltr"}>
      {labels.map((label, index) => {
        const number = index + 1;
        const complete = number < step;
        const active = number === step;
        return (
          <React.Fragment key={label}>
            <div className="flex min-w-0 flex-1 flex-col items-center text-center">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm transition-colors ${complete ? "border-emerald-600 bg-emerald-600 text-white" : active ? "border-accent bg-accent text-accent-foreground ring-4 ring-accent/15" : "border-border bg-muted text-muted-foreground"}`}>
                {complete ? <Check className="h-4 w-4" /> : number}
              </span>
              <span className={`mt-2 text-[11px] sm:text-xs ${active ? "font-bold text-foreground" : complete ? "font-medium text-emerald-700" : "text-muted-foreground"}`}>{label}</span>
            </div>
            {number < labels.length && <div className={`mt-[17px] h-0.5 flex-1 ${number < step ? "bg-emerald-600" : "bg-border"}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}