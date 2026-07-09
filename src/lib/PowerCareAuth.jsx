import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getSession, companyLogin, switchUser, clearSession, getCompanyData,
  subscribe, seedDemoIfEmpty, getCompanyMeta,
} from "./store";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [company, setCompany] = useState(null);
  const [data, setData] = useState(null);
  const [tick, setTick] = useState(0); // force refresh on store changes

  useEffect(() => {
    seedDemoIfEmpty();
    const refresh = () => setTick((t) => t + 1);
    const unsub = subscribe(refresh);
    return unsub;
  }, []);

  const refresh = useCallback(() => {
    const s = getSession();
    setSession(s);
    if (s && s.companyId) {
      setCompany(getCompanyMeta(s.companyId));
      setData(getCompanyData(s.companyId));
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