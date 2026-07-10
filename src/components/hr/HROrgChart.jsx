import React from "react";
import { useI18n } from "@/lib/i18n";
import { groupLevelsByOrder, levelName, levelNote } from "@/lib/hrLevels";
import HRTierCard from "@/components/hr/HRTierCard";

// Vertical org chart for one station's HR reporting line: highest authority down to
// the station's own HR position, connected with lines. The set of tiers, their scope,
// order, and names all come from the company's own customizable hrLevels.
export default function HROrgChart({ station, data, canManage }) {
  const { t, lang } = useI18n();

  const cluster = (data.hrClusters || []).find((c) => (c.stationIds || []).includes(station.id));
  const groups = groupLevelsByOrder(data.hrLevels || []).slice().reverse(); // highest authority first

  const nodeFor = (group) => {
    const label = levelName(group.manager || group.assistant, lang);
    if (group.scope === "station") return { scopeType: "station", scopeId: station.id, scopeName: `${label} · ${station.name}` };
    if (group.scope === "cluster") return cluster
      ? { scopeType: "cluster", scopeId: cluster.id, scopeName: `${label} · ${cluster.name}` }
      : null;
    return { scopeType: "company", scopeId: null, scopeName: label };
  };

  if (groups.length === 0) {
    return (
      <div className="p-5 rounded-xl border border-dashed border-border text-center">
        <p className="text-sm text-muted-foreground font-body italic">{t("noPositions")}</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl border border-border bg-card">
      <h3 className="font-heading font-semibold mb-4">{station.name}</h3>
      <div className="flex flex-col items-center">
        {groups.map((group, idx) => {
          const node = nodeFor(group);
          const note = group.manager ? levelNote(group.manager, lang) : "";
          return (
            <React.Fragment key={group.order}>
              {idx > 0 && <div className="w-px h-5 bg-border" />}
              {node ? (
                <div className="w-full max-w-sm">
                  <HRTierCard managerLevel={group.manager} assistantLevel={group.assistant} scopeType={node.scopeType} scopeId={node.scopeId} scopeName={node.scopeName} data={data} canManage={canManage} />
                  {note && <p className="text-[11px] text-muted-foreground font-body px-1 mt-1">{note}</p>}
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