import { getCompanyMeta, logAudit, syncCompanyAccount, updateCompany } from "@/lib/store";
import { companyRootStation } from "@/lib/stationTree";

const REGISTRY_KEY = "powercare_registry";

export function applyCompanyDisplayName(data, name) {
  const title = String(name || "").trim();
  if (!data || !title) return;
  data.name = title;
  data.settings = { ...(data.settings || {}), companyName: title };
  const root = companyRootStation(data.stations);
  if (!root) return;
  root.name = title;
  root.location = title;
  const node = (data.orgTree || []).find((item) => item.type === "station" && String(item.refId) === String(root.id));
  if (node) node.title = title;
}

export async function renameCompany(companyId, name) {
  const nextName = String(name || "").trim().slice(0, 120);
  const company = getCompanyMeta(companyId);
  if (!nextName || !company) return false;
  const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{"companies":[]}');
  const storedCompany = registry.companies.find((item) => item.id === companyId);
  if (storedCompany) storedCompany.name = nextName;
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
  updateCompany(companyId, (data) => {
    applyCompanyDisplayName(data, nextName);
  });
  logAudit(companyId, "company_name_changed", `Company name changed to "${nextName}".`);
  try {
    await syncCompanyAccount({ ...company, name: nextName });
  } catch {
    // Local name is already applied across the workspace.
  }
  return true;
}
