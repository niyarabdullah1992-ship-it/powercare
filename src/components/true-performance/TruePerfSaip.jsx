import React from "react";
import { FileCheck, Sparkles } from "lucide-react";

// بيان موجَّه للهيئة السعودية للملكية الفكرية: محل الحماية، الأصالة، التمييز، الطلب.
export default function TruePerfSaip({ saip }) {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-7 text-foreground">{saip.introAr}</p>

      <section>
        <h3 className="mb-2 flex items-center gap-2 font-heading text-lg font-semibold text-primary">
          <FileCheck className="h-4 w-4 text-accent" strokeWidth={1.7} />
          {saip.scopeTitleAr}
        </h3>
        <div className="space-y-2">
          {saip.scope.map((item) => (
            <div key={item.labelAr} className="rounded-lg border border-accent/30 bg-card px-4 py-3">
              <span className="font-heading text-sm font-semibold text-accent">{item.labelAr}</span>
              <p className="mt-1 text-[12.5px] leading-6 text-muted-foreground">{item.textAr}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 font-heading text-lg font-semibold text-primary">
          <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.7} />
          {saip.originalityTitleAr}
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {saip.originality.map((item) => (
            <div key={item.titleAr} className="rounded-lg border border-border bg-secondary/50 p-3.5">
              <span className="font-heading text-2xl font-semibold text-accent/60">{item.numAr}</span>
              <h4 className="font-heading text-[15px] font-semibold text-primary">{item.titleAr}</h4>
              <p className="mt-1 text-[12px] leading-6 text-muted-foreground">{item.textAr}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-heading text-lg font-semibold text-primary">{saip.distinctionTitleAr}</h3>
        <p className="mb-2 text-[12px] leading-6 text-muted-foreground">{saip.distinctionIntroAr}</p>
        <table className="w-full border border-border text-[12px]">
          <tbody>
            {saip.distinction.map((row, index) => (
              <tr key={row.existingAr} className={index % 2 ? "bg-secondary/40" : "bg-card"}>
                <td className="w-1/2 border border-border px-3 py-2 align-top leading-6 text-muted-foreground">{row.existingAr}</td>
                <td className="border border-border px-3 py-2 align-top leading-6 text-foreground">{row.niroAr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-accent/40 bg-primary p-5 text-primary-foreground">
        <h3 className="font-heading text-lg font-semibold">{saip.requestTitleAr}</h3>
        <p className="mt-2 text-[12.5px] leading-6 text-primary-foreground/85">{saip.requestAr}</p>
        <p className="mt-3 border-t border-primary-foreground/20 pt-3 text-[12px] leading-6 text-primary-foreground/75">{saip.declarationAr}</p>
      </section>
    </div>
  );
}