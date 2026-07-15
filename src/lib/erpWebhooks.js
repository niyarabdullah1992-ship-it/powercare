// Fire-and-forget webhook dispatch to the company's configured ERP endpoint.
// Reads the session token directly from localStorage (avoids a circular import
// with store.js, which calls this on every relevant data mutation).
import { base44 } from "@/api/base44Client";

export const ERP_EVENTS = ["employee_added", "task_created", "report_created", "payroll_item_paid"];

export function dispatchErpEvent(companyId, event, data) {
  try {
    const tokens = JSON.parse(localStorage.getItem("powercare_tokens") || "{}");
    const sessionToken = tokens[companyId];
    if (!sessionToken) return;
    base44.functions.invoke("erpApi", { action: "dispatchWebhook", companyId, sessionToken, event, data }).catch(() => {});
  } catch {
    // never let webhook delivery break a data mutation
  }
}