import { base44 } from "@/api/base44Client";

// One anonymous visit per browser tab session, with a lightweight duration heartbeat.
let trackerStarted = false;
export function trackVisit(path = "/") {
  try {
    if (trackerStarted) return;
    trackerStarted = true;
    let visitorId = localStorage.getItem("powercare_visitor_id");
    if (!visitorId) {
      visitorId = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("powercare_visitor_id", visitorId);
    }
    let visitId = sessionStorage.getItem("powercare_visit_id");
    let startedAt = Number(sessionStorage.getItem("powercare_visit_started")) || Date.now();
    sessionStorage.setItem("powercare_visit_started", String(startedAt));
    const reportDuration = () => {
      if (!visitId) return;
      base44.functions.invoke("pageVisits", { action: "duration", visitId, visitorId, durationSeconds: Math.floor((Date.now() - startedAt) / 1000) }).catch(() => {});
    };
    const beginHeartbeat = () => {
      window.setInterval(() => { if (!document.hidden) reportDuration(); }, 15000);
      document.addEventListener("visibilitychange", () => { if (document.hidden) reportDuration(); });
      window.addEventListener("pagehide", reportDuration);
    };
    if (visitId) { beginHeartbeat(); return; }
    let referrer = "";
    try { referrer = document.referrer ? new URL(document.referrer).host : ""; } catch { /* ignore */ }
    base44.functions.invoke("pageVisits", { action: "track", visitorId, path, referrer, device: window.innerWidth < 768 ? "mobile" : "desktop" }).then((response) => {
      visitId = response.data?.visitId || null;
      if (visitId) sessionStorage.setItem("powercare_visit_id", visitId);
      beginHeartbeat();
    }).catch(() => {});
  } catch {
    // Visitor analytics must never interrupt the public page.
  }
}