import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  getSession, companyLogin, employeeLogin, switchUser, clearSession, getCompanyData,
  subscribe, getCompanyMeta, hydrateEmployeesFromEntity, hydrateStationsFromEntity,
  hydrateBlobFromEntity, BLOB_CATEGORIES, getLastLocalWriteAt, fetchCloudVersions, setAuditActor,
} from "./store";
import { base44 } from "@/api/base44Client";

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
  // Per-collection version stamps from the last successful pull — lets each poll skip
  // downloading collections that haven't changed on the server (delta sync).
  const lastVersionsRef = useRef({});

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
      // Keep the audit trail attributed to whoever is actually acting in this session.
      const actorName = s.userId ? localData?.employees?.find((e) => e.id === s.userId)?.name : null;
      setAuditActor(actorName || getCompanyMeta(s.companyId)?.ownerEmail || "owner");
      // Always reconcile with the persisted database (not just on an empty cache) so
      // records created on another device/browser eventually show up here too. Local-only
      // records (not yet synced) are kept as-is; server records are merged in additively.
      if (localData && Date.now() - getLastLocalWriteAt(s.companyId) > RECENT_WRITE_GUARD_MS) {
        // Server records are authoritative for anything already synced (so leave requests,
        // certificates, HR messages, points etc. approved/edited on another device show up
        // here too). Any local record not yet synced (no server copy yet) is kept as-is.
        setIsSyncing(true);
        // Delta sync: one lightweight versions call tells us which collections actually
        // changed on the server — only those get downloaded. If the versions call fails,
        // fall back to hydrating everything (previous behavior).
        fetchCloudVersions(s.companyId).then((versions) => {
          const prev = lastVersionsRef.current[s.companyId] || {};
          const changed = (key) => !versions || versions[key] !== prev[key];
          const hydrationTasks = [];
          if (changed("employees")) hydrationTasks.push(
            hydrateEmployeesFromEntity(s.companyId).then((employees) => {
              if (!employees) return;
              setData((prevData) => {
                if (!prevData) return prevData;
                const serverIds = new Set(employees.map((e) => e.id));
                const localOnly = (prevData.employees || []).filter((e) => !serverIds.has(e.id));
                return { ...prevData, employees: [...employees, ...localOnly] };
              });
            })
          );
          if (changed("stations")) hydrationTasks.push(
            hydrateStationsFromEntity(s.companyId).then((stations) => {
              if (!stations) return;
              setData((prevData) => {
                if (!prevData) return prevData;
                const serverIds = new Set(stations.map((st) => st.id));
                const localOnly = (prevData.stations || []).filter((st) => !serverIds.has(st.id));
                return { ...prevData, stations: [...stations, ...localOnly] };
              });
            })
          );
          BLOB_CATEGORIES.forEach((category) => {
            if (!changed("blob:" + category)) return;
            hydrationTasks.push(
              hydrateBlobFromEntity(s.companyId, category).then((records) => {
                if (!records || records.length === 0) return;
                setData((prevData) => {
                  if (!prevData) return prevData;
                  const serverIds = new Set(records.map((r) => r.id));
                  const localOnly = (prevData[category] || []).filter((r) => !serverIds.has(r.id));
                  return { ...prevData, [category]: [...records, ...localOnly] };
                });
              })
            );
          });
          // Company-wide settings (name, plan, chat groups, rate limits) — single record, server wins.
          if (changed("blob:companyMeta")) hydrationTasks.push(
            hydrateBlobFromEntity(s.companyId, "companyMeta").then((records) => {
              const meta = records && records[0];
              if (!meta) return;
              setData((prevData) => (prevData ? {
                ...prevData,
                name: meta.name ?? prevData.name,
                plan: meta.plan ?? prevData.plan,
                directorId: meta.directorId ?? prevData.directorId,
                ownerId: meta.ownerId ?? prevData.ownerId,
                stationChatGroups: meta.stationChatGroups ?? prevData.stationChatGroups,
                crossStationChatEnabled: meta.crossStationChatEnabled ?? prevData.crossStationChatEnabled,
                settings: meta.settings ?? prevData.settings,
              } : prevData));
            })
          );
          Promise.allSettled(hydrationTasks).then(() => {
            if (versions) lastVersionsRef.current[s.companyId] = versions;
            setIsSyncing(false);
          });
        });
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

  // Instant cross-device sync: the backend bumps a tiny SyncSignal record after every
  // write, and this realtime subscription pulls the changes the moment it fires —
  // no waiting for the next poll. Also refreshes when the user returns to the tab.
  useEffect(() => {
    if (!session?.companyId) return;
    let unsubscribe = null;
    try {
      unsubscribe = base44.entities.SyncSignal.subscribe((event) => {
        if (event?.data?.companyId === session.companyId) refresh();
      });
    } catch {
      // realtime unavailable — the 10s poll above remains the fallback
    }
    const onVisible = () => { if (document.visibilityState !== "hidden") refresh(); };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session?.companyId, refresh]);

  const login = async (email, password) => {
    // Try the company-owner account first, then fall back to a personal employee login.
    let c = await companyLogin(email, password);
    if (!c) c = await employeeLogin(email, password);
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