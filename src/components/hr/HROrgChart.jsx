import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { groupLevelsByOrder, levelName, levelNote } from "@/lib/hrLevels";
import HRTierCard from "@/components/hr/HRTierCard";
import { UserCircle2 } from "lucide-react";

// Vertical org chart for one station's HR reporting line: highest authority down to
// the station's own HR position, connected with elegant tapered lines. The set of
// tiers, their scope, order, and names all come from the company's own customizable hrLevels.
export default function HROrgChart({ station, data, canManage }) {
  const { t, lang } = useI18n();

  const cluster = (data.hrClusters || []).find((c) => (c.stationIds || []).includes(station.id));
  const groups = groupLevelsByOrder(data.hrLevels || [])
    .filter((g) => (g.manager?.active ?? true) !== false || (g.assistant?.active ?? true) !== false)
    .filter((g) => {
      const sIds = g.manager?.stationIds || g.assistant?.stationIds || null;
      return !sIds || sIds.includes(station.id); // any tier can be restricted to chosen stations, regardless of scope
    })
    .slice()
    .reverse(); // highest authority first, suspended tiers hidden

  const nodeFor = (group) => {
    const label = levelName(group.manager || group.assistant, lang);
    if (group.scope === "station") return { scopeType: "station", scopeId: station.id, scopeName: `${label} · ${station.name}` };
    if (group.scope === "cluster") return cluster
      ? { scopeType: "cluster", scopeId: cluster.id, scopeName: `${label} · ${cluster.name}` }
      : null;
    return { scopeType: "company", scopeId: null, scopeName: label };
  };

  // The Station Manager is the base of the escalation chain (level 0, see src/lib/escalation.js)
  // but is a regular employee role, not one of the customizable HR tiers above — surface it here
  // so it's clear how it links into the hierarchy.
  const stationManager = data.employees.find((e) => e.id === station.managerId)
    || data.employees.find((e) => e.role === "station_manager" && e.stationId === station.id);

  if (groups.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-dashed border-border text-center space-y-3">
        <p className="text-sm text-muted-foreground font-body italic">{t("noPositions")}</p>
        <StationManagerNode stationManager={stationManager} t={t} />
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
        <div className="flex flex-col items-center h-8">
          <div className="w-px flex-1 bg-gradient-to-b from-accent/40 via-border to-accent/40" />
          <div className="w-1.5 h-1.5 rotate-45 bg-accent/70 my-0.5 shrink-0" />
          <div className="w-px flex-1 bg-gradient-to-b from-accent/40 via-border to-accent/40" />
        </div>
        <StationManagerNode stationManager={stationManager} t={t} />
      </div>
    </div>
  );
}

function StationManagerNode({ stationManager, t }) {
  return (
    <div className="w-full max-w-sm">
      <div className="p-4 rounded-xl border border-accent/20 bg-gradient-to-b from-card to-secondary/40 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <UserCircle2 className="w-4 h-4 text-accent shrink-0" />
          <h4 className="font-heading text-base tracking-wide">{t("stationManager")}</h4>
        </div>
        {stationManager ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-body">
            {stationManager.name}
          </span>
        ) : (
          <p className="text-xs text-amber-600 font-body">⚠ {t("noManager")}</p>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground font-body italic px-1 mt-1.5 text-center">{t("stationManagerHrNote")}</p>
      <div className="text-center mt-1">
        <Link to="/app/employees" className="text-[11px] text-accent font-body hover:underline">{t("goToEmployees")}</Link>
      </div>
    </div>
  );
}