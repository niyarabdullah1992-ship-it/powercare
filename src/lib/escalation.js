// Shared escalation-chain helpers, used by both anonymous and public complaints.
// Escalation chain: level 0 = the station manager, then straight up the company's
// customizable HR tiers (see the HR page), lowest to highest authority.
import { groupLevelsByOrder, levelName } from "./hrLevels";

export function handlersForLevel(levelIdx, r, data) {
  if (levelIdx === 0) {
    return data.employees.filter((e) => e.role === "station_manager" && e.stationId === r.stationId);
  }
  const groups = groupLevelsByOrder(data.hrLevels || []);
  const group = groups[levelIdx - 1];
  if (!group || !group.manager) return [];
  return data.employees.filter((e) => {
    if (e.hrLevelId !== group.manager.id) return false;
    if (group.scope === "station") return e.hrStationId === r.stationId;
    if (group.scope === "cluster") {
      const cluster = (data.hrClusters || []).find((c) => (c.stationIds || []).includes(r.stationId));
      return cluster ? e.hrClusterId === cluster.id : false;
    }
    return true;
  });
}

export function levelLabel(levelIdx, data, t, lang) {
  if (levelIdx === 0) return t("stationManager");
  const groups = groupLevelsByOrder(data.hrLevels || []);
  const group = groups[levelIdx - 1];
  if (!group) return "";
  return levelName(group.manager || group.assistant, lang);
}