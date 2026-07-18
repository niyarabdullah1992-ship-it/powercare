import { base44 } from "@/api/base44Client";

export async function inventoryCall(session, action, payload = {}) {
  const response = await base44.functions.invoke("inventory", {
    action,
    companyId: session.companyId,
    sessionToken: session.token,
    ...payload,
  });
  return response.data;
}