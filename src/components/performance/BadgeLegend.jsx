import React from "react";
import { useI18n } from "@/lib/i18n";
import { BADGES } from "@/lib/rewards";
import { Award } from "lucide-react";

const TIER_STYLES = [
  "from-emerald-500/15 to-emerald-500/5 ring-emerald-500/20 text-emerald-600",
  "from-teal-500/15 to-teal-500/5 ring-teal-500/20 text-teal-600",
  "from-amber-500/15 to-amber-500/5 ring-amber-500/20 text-amber-600",
  "from-orange-500/15 to-orange-500/5 ring-orange-500/20 text-orange-600",
  "from-rose-500/15 to-rose-500/5 ring-rose-500/20 text-rose-600",
];

export default function BadgeLegend() {
  const { t } = useI18n();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-border bg-muted/40 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
          <Award className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-heading text-base font-semibold leading-tight">{t("badgeTiers")}</h3>
          <p className="text-xs text-muted-foreground font-body mt-0.5">{t("badgeTiersHint")}</p>
        </div>
      </div>
      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {BADGES.map((b, i) => (
          <div
            key={b.key}
            className={`relative p-4 rounded-xl border border-border bg-gradient-to-b ring-1 ${TIER_STYLES[i] || TIER_STYLES[0]}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-2xl leading-none">{b.icon}</span>
              <span className="text-sm font-heading font-semibold">{t(b.key)}</span>
            </div>
            <p className="text-xs font-body text-muted-foreground">
              {b.min}+ {t("points")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}