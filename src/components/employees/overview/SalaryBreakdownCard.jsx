import React from "react";
import { Wallet } from "lucide-react";
import OverviewCard, { OverviewRow } from "./OverviewCard";

// مكونات الراتب: الأساسي والبدلات والصافي الشهري.
export default function SalaryBreakdownCard({ profile, ar }) {
  const currency = profile.currency || "SAR";
  const unit = currency === "SAR" ? (ar ? "ر.س" : "SAR") : currency;
  const base = Number(profile.baseSalary || 0);
  const allowances = Number(profile.allowances || 0);
  const money = (value) => `${value.toLocaleString(ar ? "ar-EG" : "en-US")} ${unit}`;

  return (
    <OverviewCard title={ar ? "مكونات الراتب" : "Salary components"} icon={Wallet}>
      <OverviewRow label={ar ? "الراتب الأساسي" : "Base salary"} value={base ? money(base) : null} dir="ltr" />
      <OverviewRow label={ar ? "البدلات" : "Allowances"} value={allowances ? money(allowances) : null} dir="ltr" />
      <div className="mt-2 flex items-baseline justify-between gap-3 border-t-2 border-border pt-3">
        <span className="text-sm font-semibold">{ar ? "الصافي الشهري" : "Monthly net"}</span>
        <span className="font-heading text-base font-bold text-accent" dir="ltr">{money(base + allowances)}</span>
      </div>
    </OverviewCard>
  );
}