import { base44 } from "@/api/base44Client";

// Fire-and-forget landing-page visit tracking.
// One anonymous visitor id per browser; one tracked visit per browser session.
export function trackVisit(path = "/") {
  try {
    if (sessionStorage.getItem("powercare_visit_tracked")) return;
    sessionStorage.setItem("powercare_visit_tracked", "1");
    let visitorId = localStorage.getItem("powercare_visitor_id");
    if (!visitorId) {
      visitorId = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("powercare_visitor_id", visitorId);
    }
    let referrer = "";
    try { referrer = document.referrer ? new URL(document.referrer).host : ""; } catch { /* ignore */ }
    base44.functions
      .invoke("pageVisits", {
        action: "track",
        visitorId,
        path,
        referrer,
        device: window.innerWidth < 768 ? "mobile" : "desktop",
      })
      .catch(() => {});
  } catch {
    // never let tracking break the page
  }
}