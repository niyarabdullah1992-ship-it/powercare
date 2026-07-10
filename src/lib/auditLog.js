// Thin client for the sensitive-actions audit trail. Writes/reads always go through
// the companyDirectory backend function (service role) since AuditLog has no public RLS.
import { base44 } from "@/api/base44Client";

export async function logAudit(companyId, action, performedBy, details) {
  try {
    await base44.functions.invoke("companyDirectory", {
      action: "logAudit",
      companyId: companyId || "platform",
      auditAction: action,
      performedBy: performedBy || "unknown",
      details: details || "",
    });
  } catch {
    // best-effort — never block the actual operation on logging failure
  }
}

export async function fetchAuditLog(companyId) {
  try {
    const res = await base44.functions.invoke("companyDirectory", { action: "getAuditLog", companyId });
    return res?.data?.logs || [];
  } catch {
    return [];
  }
}

export async function fetchAllAuditLog() {
  try {
    const res = await base44.functions.invoke("companyDirectory", { action: "getAllAuditLog", companyId: "platform" });
    return res?.data?.logs || [];
  } catch {
    return [];
  }
}