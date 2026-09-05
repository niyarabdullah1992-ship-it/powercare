import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { isLocalPreviewActive, LOCAL_PREVIEW_COMPANY_ID } from "@/lib/localPreview";
import { localExpensesCall } from "@/lib/localExpensesFallback";

function skipCloud(session) {
  return isLocalPreviewActive() || session?.companyId === LOCAL_PREVIEW_COMPANY_ID;
}

function cloudDown(error) {
  const status = error?.response?.status;
  if (!status) return true;
  return [401, 403, 404, 502, 503, 504].includes(status);
}

export async function expensesCall(session, action, payload = {}) {
  if (skipCloud(session)) return localExpensesCall(session, action, payload);
  try {
    const response = await base44.functions.invoke("expenses", {
      action,
      companyId: session.companyId,
      sessionToken: session.token || getCompanyToken(session.companyId),
      ...payload,
    });
    return response.data;
  } catch (error) {
    if (cloudDown(error)) return localExpensesCall(session, action, payload);
    throw error;
  }
}
