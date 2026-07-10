import React from "react";
import { useI18n } from "@/lib/i18n";
import { CalendarDays } from "lucide-react";
import { LEAVE_TYPES, getLeaveTotal, usedLeaveDays } from "@/lib/leaveTypes";

export default function LeaveBalanceCard({ profile, requests }) {
  const { t } = useI18n();

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <h3 className="flex items-center gap-2 font-heading font-semibold">
        <CalendarDays className="w-4 h-4 text-accent" /> {t("leaveBalance")}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {LEAVE_TYPES.filter((ty) => ty.key !== "unpaid").map((ty) => {
          const total = getLeaveTotal(profile, ty.key) ?? 0;
          const used = usedLeaveDays(requests, ty.key);
          const remaining = Math.max(0, total - used);
          const pct = total > 0 ? Math.min(100, Math.round((remaining / total) * 100)) : 0;
          return (
            <div key={ty.key} className="p-3 rounded-lg border border-border bg-background">
              <p className="text-xs text-muted-foreground font-body truncate">{t(ty.key)}</p>
              <p className="text-lg font-heading font-semibold leading-tight">
                {remaining}<span className="text-xs text-muted-foreground font-body"> / {total} {t("days")}</span>
              </p>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mt-1.5">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}