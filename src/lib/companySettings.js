import { getCompanyMeta, logAudit, syncCompanyAccount, updateCompany } from "@/lib/store";

const REGISTRY_KEY = "powercare_registry";

export async function renameCompany(companyId, name) {
  const nextName = String(name || "").trim().slice(0, 120);
  const company = getCompanyMeta(companyId);
  if (!nextName || !company) return false;
  const synced = await syncCompanyAccount({ ...company, name: nextName });
  if (!synced) return false;
  const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{"companies":[]}');
  const storedCompany = registry.companies.find((item) => item.id === companyId);
  if (storedCompany) storedCompany.name = nextName;
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
  updateCompany(companyId, (data) => { data.name = nextName; });
  logAudit(companyId, "company_name_changed", `Company name changed to "${nextName}".`);
  return true;
}