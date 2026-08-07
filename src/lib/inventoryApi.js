import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";

const pendingLists = new Map();
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function invokeWithRetry(request) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return (await request()).data;
    } catch (error) {
      if (error?.response?.status !== 429 || attempt === 3) throw error;
      const retryAfter = Number(error.response?.headers?.["retry-after"] || 0) * 1000;
      await wait(Math.max(retryAfter, 1000 * (2 ** attempt)) + Math.random() * 250);
    }
  }
}

export async function inventoryCall(session, action, payload = {}) {
  const sessionToken = session.token || getCompanyToken(session.companyId);
  const request = () => base44.functions.invoke("inventory", {
    action,
    companyId: session.companyId,
    sessionToken,
    ...payload,
  });

  if (action !== "list") return invokeWithRetry(request);

  const key = `${session.companyId}:${sessionToken}`;
  if (pendingLists.has(key)) return pendingLists.get(key);
  const pending = invokeWithRetry(request);
  pendingLists.set(key, pending);
  try {
    return await pending;
  } finally {
    if (pendingLists.get(key) === pending) pendingLists.delete(key);
  }
}