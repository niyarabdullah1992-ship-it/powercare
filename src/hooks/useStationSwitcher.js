import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations } from "@/lib/permissions";
import {
  getRecentStationScopes,
  setStationScope,
  subscribeStationScope,
} from "@/lib/stationScopeStore";
import useStationScope from "@/hooks/useStationScope";
import { deriveReadinessByStation } from "@/lib/stationReadiness";

export const OPEN_STATION_SWITCH_EVENT = "powercare:open-station-switch";

/** Any surface can raise the palette without importing it. */
export function openStationSwitcher() {
  window.dispatchEvent(new Event(OPEN_STATION_SWITCH_EVENT));
}

/**
 * Single source for the header scope: the stations a user may switch between,
 * the current selection, readiness per station, and in-place switching.
 * Switching never navigates — it only writes the scope store, so the mounted
 * section re-derives with the new station.
 */
export default function useStationSwitcher() {
  const { data, currentUser } = useAuth();
  const scope = useStationScope();
  const [recentIds, setRecentIds] = useState(() => getRecentStationScopes());

  useEffect(() => subscribeStationScope(() => setRecentIds(getRecentStationScopes())), []);

  const stations = useMemo(
    () => (data && currentUser ? visibleStations(currentUser, data) : []),
    [data, currentUser],
  );

  const readiness = useMemo(() => deriveReadinessByStation(data, stations), [data, stations]);

  const scopedStation = useMemo(
    () => (scope === "all" ? null : stations.find((s) => String(s.id) === String(scope)) || null),
    [scope, stations],
  );

  const recents = useMemo(
    () =>
      recentIds
        .map((id) => stations.find((s) => String(s.id) === String(id)))
        .filter(Boolean)
        .filter((s) => String(s.id) !== String(scope))
        .slice(0, 4),
    [recentIds, stations, scope],
  );

  const apply = useCallback((id) => setStationScope(id), []);

  /** Step through the visible stations; "all" is the entry before the first one. */
  const step = useCallback(
    (delta) => {
      if (!stations.length) return;
      const ring = ["all", ...stations.map((s) => String(s.id))];
      const at = ring.indexOf(String(scope));
      const next = ring[((at < 0 ? 0 : at) + delta + ring.length) % ring.length];
      setStationScope(next);
    },
    [stations, scope],
  );

  return {
    stations,
    scope,
    scopedStation,
    readiness,
    recents,
    apply,
    next: () => step(1),
    previous: () => step(-1),
    canSwitch: stations.length > 1,
  };
}
