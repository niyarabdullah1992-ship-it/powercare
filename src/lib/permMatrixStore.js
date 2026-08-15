import { getCompanyData, updateCompany } from "@/lib/store";
import {
  checkSetPermGate,
  collectJobTitles,
  derivePermissionMatrix,
  permKey,
  titlePermKey,
  titleSlug,
} from "@/lib/orgDerivations";

export function readPermMatrix(data) {
  const overrides = data?.permOverrides || {};
  const titles = collectJobTitles(data, data?.removedTitles);
  return {
    matrix: derivePermissionMatrix(overrides, titles),
    titles,
    permOverrides: overrides,
    removedTitles: data?.removedTitles || [],
    knownTitles: data?.knownTitles || [],
    permDirty: Object.keys(overrides).length > 0,
  };
}

export function writePermOverride(companyId, { sectionIdx, roleIdx, titleKey, scope, by }) {
  const gate = checkSetPermGate(scope);
  if (!gate.ok) return { error: gate };
  updateCompany(companyId, (data) => {
    data.permOverrides = { ...(data.permOverrides || {}) };
    const key = titleKey ? titlePermKey(sectionIdx, titleKey) : permKey(sectionIdx, roleIdx);
    data.permOverrides[key] = {
      key,
      scope: gate.scope,
      by: by || "",
      at: new Date().toISOString(),
    };
  });
  return readPermMatrix(getCompanyData(companyId));
}

export function resetPermOverrides(companyId) {
  updateCompany(companyId, (data) => {
    data.permOverrides = {};
  });
  return readPermMatrix(getCompanyData(companyId));
}

export function rememberJobTitle(companyId, label) {
  updateCompany(companyId, (data) => {
    data.knownTitles = [...new Set([...(data.knownTitles || []), label])];
    data.removedTitles = (data.removedTitles || []).filter((item) => titleSlug(item) !== titleSlug(label));
  });
  return readPermMatrix(getCompanyData(companyId));
}

export function forgetJobTitleOverrides(companyId, titleKey) {
  const id = titleSlug(titleKey);
  updateCompany(companyId, (data) => {
    data.removedTitles = [...new Set([...(data.removedTitles || []), id])];
    data.knownTitles = (data.knownTitles || []).filter((item) => titleSlug(item) !== id);
    const next = { ...(data.permOverrides || {}) };
    for (const key of Object.keys(next)) {
      if (key.includes(`:title:${id}`)) delete next[key];
    }
    data.permOverrides = next;
  });
  return readPermMatrix(getCompanyData(companyId));
}

export function isMissingRemote(err) {
  const status = err?.status || err?.response?.status || err?.data?.status;
  const text = String(err?.message || err || "");
  return status === 404 || /\b404\b/.test(text);
}
