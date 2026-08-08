import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";

export async function workProofCall(session, action, payload = {}) {
  const response = await base44.functions.invoke("workProof", {
    action,
    companyId: session.companyId,
    sessionToken: session.token || getCompanyToken(session.companyId),
    ...payload,
  });
  return response.data;
}