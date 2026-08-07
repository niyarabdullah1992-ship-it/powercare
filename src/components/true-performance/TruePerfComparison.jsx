import React from "react";
import { X, Check } from "lucide-react";

export default function TruePerfComparison({ comparison }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-right">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th className="px-4 py-3 text-[12px] font-semibold">{comparison.headers.criterion}</th>
            <th className="px-4 py-3 text-[12px] font-semibold">{comparison.headers.traditional}</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-landing-gold-light">{comparison.headers.nirovera}</th>
          </tr>
        </thead>
        <tbody>
          {comparison.rows.map((row, index) => (
            <tr key={row.criterionAr} className={index % 2 ? "bg-secondary/40" : "bg-card"}>
              <td className="border-t border-border px-4 py-3 text-[12px] font-semibold text-primary">{row.criterionAr}</td>
              <td className="border-t border-border px-4 py-3 text-[12px] leading-5 text-muted-foreground">
                <span className="flex gap-2"><X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" strokeWidth={2.4} />{row.traditionalAr}</span>
              </td>
              <td className="border-t border-border px-4 py-3 text-[12px] leading-5 text-foreground">
                <span className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2.4} />{row.niroveraAr}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}