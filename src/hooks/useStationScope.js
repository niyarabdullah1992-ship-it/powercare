import { useEffect, useState } from "react";
import {
  getStationScope,
  normalizeStationScope,
  subscribeStationScope,
} from "@/lib/stationScopeStore";

/**
 * Header station scope from Layout (`powercare:scope-change` + store).
 * Returns `all` or a station id — consumers must still enforce companyId on the server.
 */
export default function useStationScope() {
  const [stationId, setStationId] = useState(() => getStationScope());

  useEffect(() => {
    const sync = (next) => setStationId(normalizeStationScope(next ?? getStationScope()));
    const onEvent = (e) => {
      const fromDetail = e?.detail?.stationId;
      sync(fromDetail != null ? fromDetail : getStationScope());
    };
    const onStorage = (e) => {
      if (e.key && e.key !== "powercare_station_scope") return;
      sync(getStationScope());
    };
    const unsub = subscribeStationScope(sync);
    window.addEventListener("powercare:scope-change", onEvent);
    window.addEventListener("storage", onStorage);
    // Re-read once after mount in case Layout wrote before this subscribed.
    sync(getStationScope());
    return () => {
      unsub();
      window.removeEventListener("powercare:scope-change", onEvent);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return stationId;
}

export function matchesStationScope(rowStationId, scopeId) {
  const scope = normalizeStationScope(scopeId);
  if (scope === "all") return true;
  return String(rowStationId ?? "") === scope;
}
