import React, { createContext, useContext, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { resolvePeriod } from "@/lib/periods";

const PeriodContext = createContext(null);

// Holds the selected report period in the URL (?period=&from=&to=), so it
// survives navigation between sections and a page refresh.
export function PeriodProvider({ children }) {
  const { lang } = useI18n();
  const [params, setParams] = useSearchParams();

  const period = params.get("period") || "month";
  const from = params.get("from") || "";
  const to = params.get("to") || "";

  const setPeriod = useCallback((id, range = {}) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("period", id);
      if (id === "custom") {
        if (range.from) next.set("from", range.from); else next.delete("from");
        if (range.to) next.set("to", range.to); else next.delete("to");
      } else {
        next.delete("from");
        next.delete("to");
      }
      return next;
    }, { replace: true });
  }, [setParams]);

  const value = useMemo(() => ({
    period,
    from,
    to,
    setPeriod,
    resolved: resolvePeriod(period, { from, to, lang }),
  }), [period, from, to, setPeriod, lang]);

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod must be used inside PeriodProvider");
  return ctx;
}

export default PeriodContext;