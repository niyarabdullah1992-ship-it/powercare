import React from "react";
import { useI18n } from "@/lib/i18n";
import { badgeFor, nextBadge, getBadges } from "@/lib/rewards";

const SIZE = 64;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export default function EmployeePoints({ points = 0, company }) {
  const { t } = useI18n();
  const badges = getBadges(company);
  const badge = badgeFor(points, badges);
  const next = nextBadge(points, badges);
  const span = next ? next.min - badge.min : 1;
  const progressed = next ? points - badge.min : span;
  const pct = Math.max(0, Math.min(100, Math.round((progressed / span) * 100)));
  const dash = (pct / 100) * CIRC;

  return (
    <div className="mt-1.5 flex flex-col items-center gap-1 w-28">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <defs>
            <linearGradient id={`ring-${badge.key}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="hsl(var(--muted))" strokeWidth={STROKE} fill="none" />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={`url(#ring-${badge.key})`}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm leading-none">{badge.icon}</span>
          <span className="text-base font-bold leading-none mt-0.5 font-body text-foreground">{points}</span>
        </div>
      </div>
      <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase font-body">{t(badge.key)}</span>
      {next && (
        <div className="w-full">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[9px] text-muted-foreground font-body mt-0.5 text-center whitespace-nowrap">{next.min - points} {t("points")} → {next.icon}</p>
        </div>
      )}
    </div>
  );
}