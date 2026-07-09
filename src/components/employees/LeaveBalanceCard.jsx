import React from "react";
import { useI18n } from "@/lib/i18n";
import { CalendarDays } from "lucide-react";

const TOTAL_ALLOWANCE = 21;

export default function LeaveBalanceCard({ balance }) {
  const { t } = useI18n();
  const remaining = balance ?? TOTAL_ALLOWANCE;
  const used = Math.max(0, TOTAL_ALLOWANCE - remaining);
  const pct = Math.min(100, Math.round((remaining / TOTAL_ALLOWANCE) * 100));

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-heading font-semibold">
          <CalendarDays className="w-4 h-4 text-accent" /> {t("leaveBalance")}
        </h3>
        <p className="text-2xl font-heading font-semibold">
          {remaining} <span className="text-xs text-muted-foreground font-body">/ {TOTAL_ALLOWANCE} {t("days")}</span>
        </p>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground font-body">{used} / {TOTAL_ALLOWANCE} {t("days")}</p>
    </div>
  );
}