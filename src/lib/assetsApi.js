import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";

export async function assetsCall(session, action, payload = {}) {
  const sessionToken = session.token || getCompanyToken(session.companyId);
  const res = await base44.functions.invoke("assets", {
    action,
    companyId: session.companyId,
    sessionToken,
    ...payload,
  });
  return res.data;
}

export const ASSET_STATUSES = ["available", "in_custody", "inspection", "maintenance", "lost", "retired"];

export const assetStatusLabel = (status, lang) => {
  const ar = { available: "متاح", in_custody: "في العهدة", inspection: "قيد الفحص", maintenance: "تحت الصيانة", lost: "مفقود", retired: "مستبعد" };
  const en = { available: "Available", in_custody: "In custody", inspection: "Inspection", maintenance: "Maintenance", lost: "Lost", retired: "Retired" };
  return (lang === "ar" ? ar : en)[status] || status;
};