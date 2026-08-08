import React from "react";
import { Search, BadgeCheck } from "lucide-react";

// رأس لوحة المعلومات بنمط NiroVera: العنوان، البحث، وشرائح الفترة والالتزام.
export default function NiroDashboardHeader({ lang, companyName, periodLabel, compliancePct }) {
  const ar = lang === "ar";
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-primary">{ar ? "لوحة المعلومات" : "Dashboard"}</h1>
        <button
          onClick={() => window.dispatchEvent(new Event("powercare:open-search"))}
          className="flex h-11 w-full max-w-md items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground hover:border-accent/50"
        >
          <Search className="h-4 w-4 text-accent" />
          {ar ? "بحث عن موظف، طلب أو مستند..." : "Search employees, requests or documents..."}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-text">
          <BadgeCheck className="h-3.5 w-3.5" />
          {ar ? "التزام النظام" : "System compliance"} %{compliancePct}
        </span>
        <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground">{periodLabel}</span>
        <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">{companyName}</span>
      </div>
    </div>
  );
}