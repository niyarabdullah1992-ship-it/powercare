import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getSession, companyLogin, switchUser, clearSession, getCompanyData,
  subscribe, getCompanyMeta, hydrateEmployeesFromEntity, hydrateStationsFromEntity,
  hydrateBlobFromEntity, BLOB_CATEGORIES, getLastLocalWriteAt,
} from "./store";

// Skip merging in cloud data if this browser wrote locally very recently —
// gives the in-flight edit a moment to finish syncing before a poll/refresh
// could otherwise overwrite it with a stale server copy (simple conflict guard).
const RECENT_WRITE_GUARD_MS = 4000;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [company, setCompany] = useState(null);
  const [data, setData] = useState(null);
  const [tick, setTick] = useState(0); // force refresh on store changes
  const [isSyncing, setIsSyncing] = useState(false); // true while pulling the latest data from the cloud

  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    const unsub = subscribe(refresh);
    return unsub;
  }, []);

  const refresh = useCallback(() => {
    const s = getSession();
    setSession(s);
    if (s && s.companyId) {
      setCompany(getCompanyMeta(s.companyId));
      const localData = getCompanyData(s.companyId);
      setData(localData);
      // Always reconcile with the persisted database (not just on an empty cache) so
      // records created on another device/browser eventually show up here too. Local-only
      // records (not yet synced) are kept as-is; server records are merged in additively.
      if (localData && Date.now() - getLastLocalWriteAt(s.companyId) > RECENT_WRITE_GUARD_MS) {
        // Server records are authoritative for anything already synced (so leave requests,
        // certificates, HR messages, points etc. approved/edited on another device show up
        // here too). Any local record not yet synced (no server copy yet) is kept as-is.
        setIsSyncing(true);
        const hydrationTasks = [
          hydrateEmployeesFromEntity(s.companyId).then((employees) => {
            if (!employees) return;
            setData((prev) => {
              if (!prev) return prev;
              const serverIds = new Set(employees.map((e) => e.id));
              const localOnly = (prev.employees || []).filter((e) => !serverIds.has(e.id));
              return { ...prev, employees: [...employees, ...localOnly] };
            });
          }),
          hydrateStationsFromEntity(s.companyId).then((stations) => {
            if (!stations) return;
            setData((prev) => {
              if (!prev) return prev;
              const serverIds = new Set(stations.map((st) => st.id));
              const localOnly = (prev.stations || []).filter((st) => !serverIds.has(st.id));
              return { ...prev, stations: [...stations, ...localOnly] };
            });
          }),
          ...BLOB_CATEGORIES.map((category) =>
            hydrateBlobFromEntity(s.companyId, category).then((records) => {
              if (!records || records.length === 0) return;
              setData((prev) => {
                if (!prev) return prev;
                const serverIds = new Set(records.map((r) => r.id));
                const localOnly = (prev[category] || []).filter((r) => !serverIds.has(r.id));
                return { ...prev, [category]: [...records, ...localOnly] };
              });
            })
          ),
          // Company-wide settings (name, plan, chat groups, rate limits) — single record, server wins.
          hydrateBlobFromEntity(s.companyId, "companyMeta").then((records) => {
            const meta = records && records[0];
            if (!meta) return;
            setData((prev) => (prev ? {
              ...prev,
              name: meta.name ?? prev.name,
              plan: meta.plan ?? prev.plan,
              directorId: meta.directorId ?? prev.directorId,
              ownerId: meta.ownerId ?? prev.ownerId,
              stationChatGroups: meta.stationChatGroups ?? prev.stationChatGroups,
              crossStationChatEnabled: meta.crossStationChatEnabled ?? prev.crossStationChatEnabled,
              settings: meta.settings ?? prev.settings,
            } : prev));
          }),
        ];
        Promise.allSettled(hydrationTasks).then(() => setIsSyncing(false));
      }
    } else {
      setCompany(null);
      setData(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, tick]);

  // Live cross-device sync: periodically pull the latest persisted data while the app stays open,
  // so changes made on another device/browser show up here without needing a manual reload.
  useEffect(() => {
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const login = async (email, password) => {
    const c = await companyLogin(email, password);
    if (c) refresh();
    return c;
  };

  const doSwitchUser = (userId) => {
    switchUser(userId);
    refresh();
  };

  const logout = () => {
    clearSession();
    refresh();
  };

  const currentUser = data && session?.userId
    ? data.employees.find((e) => e.id === session.userId)
    : null;

  return (
    <AuthContext.Provider
      value={{ session, company, data, currentUser, login, switchUser: doSwitchUser, logout, refresh, tick, isSyncing }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}