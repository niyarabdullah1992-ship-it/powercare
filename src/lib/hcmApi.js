import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { isLocalPreviewActive, LOCAL_PREVIEW_COMPANY_ID } from "@/lib/localPreview";
import { localHcmCall } from "@/lib/localHcmFallback";

function skipCloud(companyId) {
  return isLocalPreviewActive() || companyId === LOCAL_PREVIEW_COMPANY_ID;
}

function cloudDown(error) {
  const status = error?.response?.status;
  if (!status) return true;
  return [401, 403, 404, 502, 503, 504].includes(status);
}

export async function hcmCall(payload = {}) {
  const companyId = payload.companyId;
  if (skipCloud(companyId)) return localHcmCall(payload);
  try {
    const res = await base44.functions.invoke("hcm", {
      ...payload,
      companyId,
      sessionToken: payload.sessionToken || getCompanyToken(companyId),
    });
    return res?.data ?? res;
  } catch (error) {
    if (cloudDown(error)) return localHcmCall(payload);
    throw error;
  }
}
