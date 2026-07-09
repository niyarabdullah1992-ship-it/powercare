import React from "react";
import { useI18n } from "@/lib/i18n";
import { badgeFor, nextBadge, getBadges } from "@/lib/rewards";

export default function EmployeePoints({ points = 0, company }) {
  const { t } = useI18n();
  const badges = getBadges(company);
  const badge = badgeFor(points, badges);
  const next = nextBadge(points, badges);
  const pct = next ? Math.min(Math.round((points / next.min) * 100), 100) : 100;

  return (
    <div className="mt-1.5 space-y-1.5 max-w-[160px]">
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-accent/15 to-accent/5 text-accent text-[10px] font-body font-semibold border border-accent/20">
          <span className="text-xs leading-none">{badge.icon}</span> {points} {t("points")}
        </span>
        <span className="text-[10px] text-muted-foreground font-body truncate">{t(badge.key)}</span>
      </div>
      {next && (
        <div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[9px] text-muted-foreground font-body mt-0.5">{next.min - points} {t("points")} → {next.icon}</p>
        </div>
      )}
    </div>
  );
}