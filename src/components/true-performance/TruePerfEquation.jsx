import React from "react";
import { MapPin, Camera, ShieldCheck, Award, Plus, ArrowDown } from "lucide-react";

const ICONS = { MapPin, Camera };

// رسم توضيحي للمعادلة: مدخلان -> قاعدة تحقق -> مخرج واحد.
export default function TruePerfEquation({ equation }) {
  return (
    <div className="rounded-lg border border-accent/40 bg-secondary/40 p-6">
      <p className="text-sm leading-7 text-foreground">{equation.introAr}</p>

      <div className="mt-6 flex items-stretch justify-center gap-3">
        {equation.inputs.map((input, index) => {
          const Icon = ICONS[input.icon] || MapPin;
          return (
            <React.Fragment key={input.labelAr}>
              {index === 1 && (
                <div className="flex items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/50 bg-background text-accent">
                    <Plus className="h-4 w-4" strokeWidth={2} />
                  </span>
                </div>
              )}
              <div className="flex-1 rounded-lg border border-border bg-card p-4 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-primary text-accent">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <p className="mt-3 font-heading text-lg font-semibold text-primary">{input.labelAr}</p>
                <p className="mt-1 text-[11px] uppercase tracking-widest text-accent">{input.tagEn}</p>
                <p className="mt-2 text-[12px] leading-5 text-muted-foreground">{input.subAr}</p>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex justify-center py-2 text-accent"><ArrowDown className="h-5 w-5" strokeWidth={1.8} /></div>

      <div className="rounded-lg border border-accent bg-primary px-5 py-4 text-center text-primary-foreground">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" strokeWidth={1.7} />
          <p className="font-heading text-xl font-semibold">{equation.ruleAr}</p>
        </div>
        <p className="mt-1 text-[12px] text-primary-foreground/80">{equation.ruleSubAr}</p>
      </div>

      <div className="flex justify-center py-2 text-accent"><ArrowDown className="h-5 w-5" strokeWidth={1.8} /></div>

      <div className="rounded-lg border-2 border-accent bg-card px-5 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Award className="h-5 w-5 text-accent" strokeWidth={1.7} />
          <p className="font-heading text-xl font-semibold text-primary">{equation.outputAr}</p>
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">{equation.outputSubAr}</p>
      </div>
    </div>
  );
}