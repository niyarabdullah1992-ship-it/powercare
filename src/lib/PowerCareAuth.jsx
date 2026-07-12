import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getSession, companyLogin, switchUser, clearSession, getCompanyData,
  subscribe, getCompanyMeta, hydrateEmployeesFromEntity, hydrateStationsFromEntity,
} from "./store";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [company, setCompany] = useState(null);
  const [data, setData] = useState(null);
  const [tick, setTick] = useState(0); // force refresh on store changes

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
      if (localData) {
        hydrateEmployeesFromEntity(s.companyId).then((employees) => {
          if (!employees) return;
          setData((prev) => {
            if (!prev) return prev;
            const localIds = new Set((prev.employees || []).map((e) => e.id));
            const merged = [...(prev.employees || []), ...employees.filter((e) => !localIds.has(e.id))];
            return { ...prev, employees: merged };
          });
        });
        hydrateStationsFromEntity(s.companyId).then((stations) => {
          if (!stations) return;
          setData((prev) => {
            if (!prev) return prev;
            const localIds = new Set((prev.stations || []).map((st) => st.id));
            const merged = [...(prev.stations || []), ...stations.filter((st) => !localIds.has(st.id))];
            return { ...prev, stations: merged };
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

  const login = (email, password) => {
    const c = companyLogin(email, password);
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
      value={{ session, company, data, currentUser, login, switchUser: doSwitchUser, logout, refresh, tick }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}