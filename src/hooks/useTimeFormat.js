import { useEffect, useState } from "react";

const STORAGE_KEY = "powercare_time_format";
const EVENT_NAME = "powercare-time-format-change";

export function useTimeFormat() {
  const [format, setFormatState] = useState(() => localStorage.getItem(STORAGE_KEY) || "24");

  useEffect(() => {
    const sync = () => setFormatState(localStorage.getItem(STORAGE_KEY) || "24");
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setFormat = (value) => {
    localStorage.setItem(STORAGE_KEY, value);
    window.dispatchEvent(new Event(EVENT_NAME));
  };

  return { format, setFormat };
}

export function formatTime(value, format, locale) {
  if (!value) return "—";
  const raw = String(value);
  const date = raw.includes("T") || raw.includes("-")
    ? new Date(raw)
    : new Date(2000, 0, 1, Number(raw.split(":")[0]), Number(raw.split(":")[1]));
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleTimeString(locale || undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: format === "12" ? "h12" : "h23",
  });
}