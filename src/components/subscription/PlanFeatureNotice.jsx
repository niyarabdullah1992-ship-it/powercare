import React from "react";
import { Link } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function PlanFeatureNotice() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm"><span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-accent" />{ar ? "ميزة التصدير غير متاحة في باقتك الحالية" : "Exports are not included in your current plan"}</span><Link to="/pricing" className="shrink-0 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground">{ar ? "ترقية" : "Upgrade"}</Link></div>;
}