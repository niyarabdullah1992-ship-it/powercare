import React from "react";
import { useI18n } from "@/lib/i18n";
import { groupLevelsByOrder, levelName, levelNote } from "@/lib/hrLevels";
import HRTierCard from "@/components/hr/HRTierCard";

// Vertical org chart for one station's HR reporting line: highest authority down to
// the station's own HR position, connected with elegant tapered lines. The set of
// tiers, their scope, order, and names all come from the company's own customizable hrLevels.
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
      <div className="p-6 rounded-2xl border border-dashed border-border text-center">
        <p className="text-sm text-muted-foreground font-body italic">{t("noPositions")}</p>
      </div>
    );
  }

  return (
    <div className="relative p-6 sm:p-8 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      <h3 className="font-heading text-xl font-medium tracking-wide text-center mb-1">{station.name}</h3>
      <p className="text-[10px] uppercase tracking-widest-xl text-muted-foreground text-center mb-6">{t("orgChart")}</p>
      <div className="flex flex-col items-center">
        {groups.map((group, idx) => {
          const node = nodeFor(group);
          const note = group.manager ? levelNote(group.manager, lang) : "";
          return (
            <React.Fragment key={group.order}>
              {idx > 0 && (
                <div className="flex flex-col items-center h-8">
                  <div className="w-px flex-1 bg-gradient-to-b from-accent/40 via-border to-accent/40" />
                  <div className="w-1.5 h-1.5 rotate-45 bg-accent/70 my-0.5 shrink-0" />
                  <div className="w-px flex-1 bg-gradient-to-b from-accent/40 via-border to-accent/40" />
                </div>
              )}
              {node ? (
                <div className="w-full max-w-sm">
                  <HRTierCard managerLevel={group.manager} assistantLevel={group.assistant} scopeType={node.scopeType} scopeId={node.scopeId} scopeName={node.scopeName} data={data} canManage={canManage} />
                  {note && <p className="text-[11px] text-muted-foreground font-body italic px-1 mt-1.5 text-center">{note}</p>}
                </div>
              ) : (
                <div className="w-full max-w-sm p-4 rounded-xl border border-dashed border-border text-center">
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