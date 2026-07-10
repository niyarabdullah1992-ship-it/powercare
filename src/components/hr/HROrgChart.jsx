import React from "react";
import { useI18n } from "@/lib/i18n";
import { tierLevelId, tierName, HR_TIER_COUNT } from "@/lib/hrLevels";
import { UserCog } from "lucide-react";

// Vertical org chart for one station's HR reporting line: Tier 5 (top authority)
// down to Tier 1 (the station's own HR manager), connected with lines.
export default function HROrgChart({ station, data }) {
  const { t, lang } = useI18n();

  const cluster = (data.hrClusters || []).find((c) => (c.stationIds || []).includes(station.id));

  const managersFor = (tier) => {
    const levelId = tierLevelId(tier, "manager");
    const all = data.employees.filter((e) => e.hrLevelId === levelId);
    if (tier === 1) return all.filter((e) => e.hrStationId === station.id);
    if (tier === 2) return cluster ? all.filter((e) => e.hrClusterId === cluster.id) : [];
    return all;
  };

  const scopeLabelFor = (tier) => {
    if (tier === 1) return station.name;
    if (tier === 2) return cluster ? cluster.name : t("noClusters");
    return t("companyWide");
  };

  const tiers = Array.from({ length: HR_TIER_COUNT }, (_, i) => HR_TIER_COUNT - i); // 5..1

  return (
    <div className="p-5 rounded-xl border border-border bg-card">
      <h3 className="font-heading font-semibold mb-4">{station.name}</h3>
      <div className="flex flex-col items-center">
        {tiers.map((tier, idx) => {
          const managers = managersFor(tier);
          return (
            <React.Fragment key={tier}>
              {idx > 0 && <div className="w-px h-5 bg-border" />}
              <div className="w-full max-w-sm p-3 rounded-lg border border-border bg-background text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <UserCog className="w-3.5 h-3.5 text-accent" />
                  <p className="text-sm font-body font-medium">{tierName(tier, "manager", lang)}</p>
                </div>
                <p className="text-[10px] text-muted-foreground font-body">{t("tier")} {tier} · {scopeLabelFor(tier)}</p>
                {managers.length === 0 ? (
                  <p className="text-xs text-muted-foreground font-body italic">{t("noManagerAssigned")}</p>
                ) : (
                  <p className="text-xs font-body">{managers.map((m) => m.name).join(", ")}</p>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}