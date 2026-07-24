import React from "react";
import { Crown, ShieldCheck, Star } from "lucide-react";

export default function OrgTreeLegend({ ar }) {
  const ranks = [
    [Crown, ar ? "مدير" : "Manager", "border-accent bg-primary text-primary-foreground"],
    [Star, ar ? "سوبرفايزر" : "Supervisor", "border-accent bg-card text-foreground"],
    [ShieldCheck, ar ? "قائد فريق" : "Team lead", "border-primary/50 bg-secondary text-foreground"],
  ];
  return <aside className="absolute bottom-3 left-3 z-20 flex flex-wrap gap-1.5 rounded-lg border border-border bg-card/95 p-2 shadow-elevated backdrop-blur-sm" aria-label={ar ? "مفتاح رتب المناصب" : "Position rank legend"}>
    {ranks.map(([Icon, label, style]) => <span key={label} className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold ${style}`}><Icon className="h-3 w-3 text-accent" />{label}</span>)}
  </aside>;
}