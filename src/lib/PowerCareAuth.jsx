import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  getSession, startLogin, completeLoginOtp, switchUser, clearSession, getCompanyData,
  subscribe, getCompanyMeta, hydrateEmployeesFromEntity, hydrateStationsFromEntity,
  hydrateBlobFromEntity, BLOB_CATEGORIES, getLastLocalWriteAt, fetchCloudVersions, setAuditActor,
  repairOwnerSession, cacheCloudData, googleCompanyLogin, companyAccountExists, ensureLocalCompany,
} from "./store";
import { base44 } from "@/api/base44Client";

// Skip merging in cloud data if this browser wrote locally very recently —
// gives the in-flight edit a moment to finish syncing before a poll/refresh
// could otherwise overwrite it with a stale server copy (simple conflict guard).
const RECENT_WRITE_GUARD_MS = 4000;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Read the saved session synchronously on first render — otherwise a direct
  // visit to /app redirects logged-in users to the landing page before the
  // first effect has a chance to restore the session.
  const [session, setSession] = useState(() => getSession());
  const [company, setCompany] = useState(() => {
    const s = getSession();
    return s?.companyId ? getCompanyMeta(s.companyId) : null;
  });
  const [data, setData] = useState(() => {
    const s = getSession();
    return s?.companyId ? getCompanyData(s.companyId) : null;
  });
  const [tick, setTick] = useState(0); // force refresh on store changes
  const [isSyncing, setIsSyncing] = useState(false); // true while pulling the latest data from the cloud
  // Per-collection version stamps from the last successful pull — lets each poll skip
  // downloading collections that haven't changed on the server (delta sync).
  const lastVersionsRef = useRef({});
  const syncInFlightRef = useRef(false);

  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    const unsub = subscribe(refresh);
    return unsub;
  }, []);

  const refresh = useCallback(() => {
    const s = getSession();
    setSession(s);
    if (s && s.companyId) {
      // A saved session with no local workspace (partially cleared storage)
      // previously rendered a blank app — rebuild it so cloud sync refills it.
      if (!getCompanyData(s.companyId)) ensureLocalCompany(s.companyId);
      setCompany(getCompanyMeta(s.companyId));
      const localData = getCompanyData(s.companyId);
      setData(localData);
      // Owner sessions saved without a userId (empty new accounts) render a blank
      // app — create the owner user record and re-save the session once.
      if (!s.userId && localData) {
        repairOwnerSession(s.companyId);
        return;
      }
      // A stale session userId (e.g. saved before the account was restored, or
      // created locally before cloud data arrived) that no longer matches any
      // employee rendered a blank app — re-point the session at the company
      // owner/director from the synced roster.
      if (s.userId && localData) {
        const emps = localData.employees || [];
        if (emps.length > 0 && !emps.some((e) => e.id === s.userId)) {
          const fallback = emps.find((e) => e.id === localData.ownerId) || emps.find((e) => e.role === "director");
          if (fallback) {
            switchUser(fallback.id);
            return;
          }
        }
      }
      // Keep the audit trail attributed to whoever is actually acting in this session.
      const actorName = s.userId ? localData?.employees?.find((e) => e.id === s.userId)?.name : null;
      setAuditActor(actorName || getCompanyMeta(s.companyId)?.ownerEmail || "owner");
      // Always reconcile with the persisted database (not just on an empty cache) so
      // records created on another device/browser eventually show up here too. Local-only
      // records (not yet synced) are kept as-is; server records are merged in additively.
      if (localData && !syncInFlightRef.current && Date.now() - getLastLocalWriteAt(s.companyId) > RECENT_WRITE_GUARD_MS) {
        syncInFlightRef.current = true;
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
              cacheCloudData(s.companyId, { employees });
              setData((prevData) => {
                if (!prevData) return prevData;
                return { ...prevData, employees };
              });
            })
          );
          if (changed("stations")) hydrationTasks.push(
            hydrateStationsFromEntity(s.companyId).then((stations) => {
              if (!stations) return;
              cacheCloudData(s.companyId, { stations });
              setData((prevData) => {
                if (!prevData) return prevData;
                return { ...prevData, stations };
              });
            })
          );
          BLOB_CATEGORIES.forEach((category) => {
            if (!changed("blob:" + category)) return;
            hydrationTasks.push(
              hydrateBlobFromEntity(s.companyId, category).then((records) => {
                if (!records) return;
                cacheCloudData(s.companyId, { [category]: records });
                setData((prevData) => (prevData ? { ...prevData, [category]: records } : prevData));
              })
            );
          });
          // Company-wide settings (name, plan, chat groups, rate limits) — single record, server wins.
          if (changed("blob:companyMeta")) hydrationTasks.push(
            hydrateBlobFromEntity(s.companyId, "companyMeta").then((records) => {
              const meta = records && records[0];
              if (!meta) return;
              const metaUpdates = {
                name: meta.name, plan: meta.plan, directorId: meta.directorId,
                ownerId: meta.ownerId, stationChatGroups: meta.stationChatGroups,
                crossStationChatEnabled: meta.crossStationChatEnabled,
                settings: meta.settings, reportBranding: meta.reportBranding,
              };
              cacheCloudData(s.companyId, Object.fromEntries(Object.entries(metaUpdates).filter(([, value]) => value !== undefined)));
              setData((prevData) => (prevData ? {
                ...prevData,
                name: meta.name ?? prevData.name,
                plan: meta.plan ?? prevData.plan,
                directorId: meta.directorId ?? prevData.directorId,
                ownerId: meta.ownerId ?? prevData.ownerId,
                stationChatGroups: meta.stationChatGroups ?? prevData.stationChatGroups,
                crossStationChatEnabled: meta.crossStationChatEnabled ?? prevData.crossStationChatEnabled,
                settings: meta.settings ?? prevData.settings,
                reportBranding: meta.reportBranding ?? prevData.reportBranding,
                } : prevData));
            })
          );
          Promise.allSettled(hydrationTasks).then(() => {
            if (versions) lastVersionsRef.current[s.companyId] = versions;
            syncInFlightRef.current = false;
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

  // If the saved session points at a company account that no longer exists on the
  // server (e.g. it was deleted), the app would render blank — sign out instead so
  // the user lands back on the login page.
  useEffect(() => {
    if (!session?.companyId) return;
    companyAccountExists(session.companyId).then((exists) => {
      if (!exists) {
        clearSession();
        refresh();
      }
    });
  }, [session?.companyId, refresh]);

  // Live cross-device sync: periodically pull the latest persisted data while the app stays open,
  // so changes made on another device/browser show up here without needing a manual reload.
  useEffect(() => {
    const poll = () => {
      if (document.visibilityState === "visible" && navigator.onLine !== false) refresh();
    };
    const interval = setInterval(poll, 30000);
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

  // Step 1: password check — either logs in directly (offline fallback) or returns
  // { otpRequired, pendingId } after the server emails a one-time verification code.
  const login = async (email, password) => {
    const r = await startLogin(email, password);
    if (r?.company) refresh();
    return r;
  };

  // Step 2: exchanges the emailed code for the real session.
  const verifyOtp = async (pendingId, code, password) => {
    const c = await completeLoginOtp(pendingId, code, password);
    if (c) refresh();
    return c;
  };

  const loginWithGoogle = async () => {
    const company = await googleCompanyLogin();
    if (company) refresh();
    return company;
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
      value={{ session, company, data, currentUser, login, loginWithGoogle, verifyOtp, switchUser: doSwitchUser, logout, refresh, tick, isSyncing }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}