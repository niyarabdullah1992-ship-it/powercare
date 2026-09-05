import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";

export async function loadAssistantMemory(companyId) {
  const response = await base44.functions.invoke("companyDirectory", { action: "getNiroMemory", companyId, sessionToken: getCompanyToken(companyId) });
  return Array.isArray(response?.data?.memory) ? response.data.memory.map((item) => typeof item === "string" ? item : item?.text).filter(Boolean) : [];
}

export async function saveAssistantMemory(companyId, memory) {
  const cleaned = [...new Set((memory || []).map((item) => String(item).trim()).filter(Boolean))].slice(-20);
  await base44.functions.invoke("companyDirectory", { action: "saveNiroMemory", companyId, sessionToken: getCompanyToken(companyId), memory: cleaned });
  return cleaned;
}