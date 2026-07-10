import React from "react";
import { useI18n } from "@/lib/i18n";
import { tierName, tierNote, HR_TIER_COUNT } from "@/lib/hrLevels";
import HRTierCard from "@/components/hr/HRTierCard";

// Vertical org chart for one station's HR reporting line: Tier 5 (top authority)
// down to Tier 1 (the station's own HR manager), connected with lines.
// Each tier node is a full HRTierCard so managers/assistants can be assigned or removed inline.
export default function HROrgChart({ station, data, canManage }) {
  const { t, lang } = useI18n();

  const cluster = (data.hrClusters || []).find((c) => (c.stationIds || []).includes(station.id));

  const nodeFor = (tier) => {
    if (tier === 1) return { scopeType: "station", scopeId: station.id, scopeName: `${t("tier")} 1 · ${station.name}` };
    if (tier === 2) return cluster
      ? { scopeType: "cluster", scopeId: cluster.id, scopeName: `${t("tier")} 2 · ${cluster.name}` }
      : null;
    return { scopeType: "company", scopeId: null, scopeName: `${t("tier")} ${tier} · ${tierName(tier, "manager", lang)}` };
  };

  const tiers = Array.from({ length: HR_TIER_COUNT }, (_, i) => HR_TIER_COUNT - i); // 5..1

  return (
    <div className="p-5 rounded-xl border border-border bg-card">
      <h3 className="font-heading font-semibold mb-4">{station.name}</h3>
      <div className="flex flex-col items-center">
        {tiers.map((tier, idx) => {
          const node = nodeFor(tier);
          return (
            <React.Fragment key={tier}>
              {idx > 0 && <div className="w-px h-5 bg-border" />}
              {node ? (
                <div className="w-full max-w-sm">
                  <HRTierCard tier={tier} scopeType={node.scopeType} scopeId={node.scopeId} scopeName={node.scopeName} data={data} canManage={canManage} />
                  <p className="text-[11px] text-muted-foreground font-body px-1 mt-1">{tierNote(tier, lang)}</p>
                </div>
              ) : (
                <div className="w-full max-w-sm p-3 rounded-lg border border-dashed border-border text-center">
                  <p className="text-xs text-muted-foreground font-body italic">{t("noClusters")}</p>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}