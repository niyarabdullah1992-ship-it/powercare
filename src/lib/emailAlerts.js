import { base44 } from "@/api/base44Client";

// Fire-and-forget email alerts sent from the company's connected Gmail account.
// Reads the session token straight from localStorage to avoid a circular import with store.js.
function getToken(companyId) {
  try {
    return JSON.parse(localStorage.getItem("powercare_tokens") || "{}")[companyId] || null;
  } catch {
    return null;
  }
}

export function sendEmailAlert(companyId, to, subject, text) {
  if (!to) return;
  base44.functions
    .invoke("gmailNotify", { companyId, sessionToken: getToken(companyId), to, subject, text })
    .catch(() => {});
}