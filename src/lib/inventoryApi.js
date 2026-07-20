import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";

export async function inventoryCall(session, action, payload = {}) {
  const request = () => base44.functions.invoke("inventory", {
    action,
    companyId: session.companyId,
    sessionToken: session.token || getCompanyToken(session.companyId),
    ...payload,
  });

  try {
    return (await request()).data;
  } catch (error) {
    if (error?.response?.status !== 429) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return (await request()).data;
  }
}