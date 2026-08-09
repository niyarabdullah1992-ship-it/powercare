import React, { createContext, useContext, useMemo, useState } from "react";
import { resolvePeriod } from "@/lib/performancePeriod";

const PeriodContext = createContext(null);
const STORAGE_KEY = "powercare_performance_period";

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

// The period is context for the whole Performance section — one selection that
// survives tab switches and reloads, not per-screen state.
export function PerformancePeriodProvider({ children }) {
  const stored = readStored();
  const [preset, setPresetState] = useState(stored.preset || "last30");
  const [customStart, setCustomStart] = useState(stored.customStart || "");
  const [customEnd, setCustomEnd] = useState(stored.customEnd || "");
  const [compare, setCompareState] = useState(stored.compare !== false);

  const persist = (next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ preset, customStart, customEnd, compare, ...next }));
  };
  const setPreset = (v) => { setPresetState(v); persist({ preset: v }); };
  const setCompare = (v) => { setCompareState(v); persist({ compare: v }); };
  const setStart = (v) => { setCustomStart(v); persist({ customStart: v }); };
  const setEnd = (v) => { setCustomEnd(v); persist({ customEnd: v }); };

  const value = useMemo(() => ({
    preset, setPreset,
    customStart, setCustomStart: setStart,
    customEnd, setCustomEnd: setEnd,
    compare, setCompare,
    resolved: resolvePeriod(preset, customStart, customEnd),
  }), [preset, customStart, customEnd, compare]);

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePerformancePeriod() {
  return useContext(PeriodContext);
}