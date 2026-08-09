import { useEffect, useRef } from "react";

// Shared polling engine for all live sections (notifications, chat, owner panel).
// - Never polls while the tab is hidden or the device is offline; refreshes once on return.
// - Backs off progressively (baseInterval → maxInterval) while nothing changes,
//   and snaps back to baseInterval as soon as the callback reports an update.
// The callback may return true to signal "there was fresh data".
export default function useSmartPolling(callback, { baseInterval = 5000, maxInterval = 60000, enabled = true } = {}) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;
    let timer = null;
    let delay = baseInterval;
    let running = false;
    let stopped = false;

    const schedule = () => {
      clearTimeout(timer);
      if (stopped) return;
      timer = setTimeout(tick, delay);
    };

    const tick = async () => {
      if (running) return schedule();
      if (document.visibilityState !== "visible" || navigator.onLine === false) return schedule();
      running = true;
      try {
        const changed = await callbackRef.current();
        delay = changed ? baseInterval : Math.min(delay * 2, maxInterval);
      } finally {
        running = false;
        schedule();
      }
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      delay = baseInterval;
      tick();
    };

    tick();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [enabled, baseInterval, maxInterval]);
}