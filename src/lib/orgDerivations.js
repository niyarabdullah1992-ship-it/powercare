/** Client mirror of base44/shared/orgDerivations.ts */

export const SCOPE = { NONE: 0, COMPANY: 1, OWN: 2, DELEGATED: 3, STATION: 4, REGION: 5 };
export const SCOPE_CYCLE = [SCOPE.NONE, SCOPE.OWN, SCOPE.STATION, SCOPE.REGION, SCOPE.COMPANY];
export const ORG_ROLES = ["ops_director", "station_manager", "supervisor", "safety", "employee"];
export const ORG_SECTIONS = ["command", "operations", "attendance", "daily", "hse", "complaints", "leave", "hr", "payroll", "settings"];

export const BASELINE_MATRIX = [
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.NONE, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.DELEGATED, SCOPE.DELEGATED, SCOPE.DELEGATED, SCOPE.DELEGATED],
  [SCOPE.COMPANY, SCOPE.DELEGATED, SCOPE.COMPANY, SCOPE.DELEGATED, SCOPE.DELEGATED],
  [SCOPE.COMPANY, SCOPE.NONE, SCOPE.NONE, SCOPE.NONE, SCOPE.NONE],
];

export function permKey(sectionIdx, roleIdx) {
  return `${sectionIdx}:${roleIdx}`;
}

export function parseDay(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function isoLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function baselineScope(sectionIdx, roleIdx) {
  const row = BASELINE_MATRIX[sectionIdx];
  if (!row || roleIdx < 0 || roleIdx >= row.length) return SCOPE.NONE;
  return row[roleIdx];
}

export function effectiveScope(sectionIdx, roleIdx, overrides = {}) {
  const baseline = baselineScope(sectionIdx, roleIdx);
  const key = permKey(sectionIdx, roleIdx);
  const raw = overrides[key];
  const overrideScope = raw == null ? null : typeof raw === "number" ? raw : raw.scope;
  if (overrideScope != null && overrideScope !== SCOPE.DELEGATED) {
    return { scope: overrideScope, derived: false, overridden: true, baseline };
  }
  return { scope: baseline, derived: baseline === SCOPE.DELEGATED, overridden: false, baseline };
}

export function nextScopeInCycle(current) {
  if (current === SCOPE.DELEGATED) return SCOPE.DELEGATED;
  const at = SCOPE_CYCLE.indexOf(current);
  if (at < 0) return SCOPE_CYCLE[0];
  return SCOPE_CYCLE[(at + 1) % SCOPE_CYCLE.length];
}

export function checkSetPermGate(nextScope) {
  if (Number(nextScope) === SCOPE.DELEGATED) {
    return {
      ok: false,
      error: "DELEGATED_IS_DERIVED",
      reason: "«بتفويض» حالة مشتقة من سجل التفويض — لا تُضبط من المصفوفة.",
      reasonEn: "\"Delegated\" is derived from the delegation register — not set from the matrix.",
    };
  }
  if (![SCOPE.NONE, SCOPE.OWN, SCOPE.STATION, SCOPE.REGION, SCOPE.COMPANY].includes(Number(nextScope))) {
    return { ok: false, error: "INVALID_SCOPE", reason: "نطاق صلاحية غير معروف.", reasonEn: "Unknown permission scope." };
  }
  return { ok: true, scope: Number(nextScope) };
}

export function derivePermissionMatrix(overrides = {}) {
  return ORG_SECTIONS.map((sectionId, si) => ({
    sectionId,
    cells: ORG_ROLES.map((roleId, ri) => ({ roleId, ...effectiveScope(si, ri, overrides) })),
  }));
}

export function checkCreateBranchGate({ name, managerId, managerName } = {}) {
  const nm = String(name || "").trim();
  const manager = String(managerId || managerName || "").trim();
  if (!nm) return { ok: false, error: "BRANCH_NAME_REQUIRED", reason: "اسم الفرع مطلوب.", reasonEn: "Branch name is required." };
  if (!manager) return { ok: false, error: "BRANCH_MANAGER_REQUIRED", reason: "مسؤول الفرع مطلوب.", reasonEn: "Branch manager is required." };
  return { ok: true, name: nm, manager };
}

export function wouldCreateCycle(nodes, nodeId, newParentId) {
  if (!newParentId) return false;
  if (newParentId === nodeId) return true;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let cursor = byId.get(newParentId);
  const seen = new Set();
  while (cursor) {
    if (cursor.id === nodeId) return true;
    if (seen.has(cursor.id)) return true;
    seen.add(cursor.id);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return false;
}

export function checkReparentGate(nodes, nodeId, newParentId) {
  if (!nodeId) return { ok: false, error: "NODE_REQUIRED", reason: "العقدة مطلوبة.", reasonEn: "Node is required." };
  if (!nodes.some((n) => n.id === nodeId)) return { ok: false, error: "NODE_NOT_FOUND", reason: "العقدة غير موجودة.", reasonEn: "Node not found." };
  if (newParentId && !nodes.some((n) => n.id === newParentId)) {
    return { ok: false, error: "PARENT_NOT_FOUND", reason: "الأب غير موجود.", reasonEn: "Parent not found." };
  }
  if (wouldCreateCycle(nodes, nodeId, newParentId)) {
    return {
      ok: false,
      error: "CYCLE_FORBIDDEN",
      reason: "لا يمكن جعل عقدة أبًا لنفسها أو لسلفها — الدورة ممنوعة.",
      reasonEn: "A node cannot be placed under itself or its descendant — cycles are forbidden.",
    };
  }
  return { ok: true };
}

export function isDelegationExpired(end, now = new Date()) {
  const due = parseDay(end);
  if (!due) return true;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return due.getTime() < today.getTime();
}

export function isDelegationActive(d, now = new Date()) {
  return !d.revoked && !isDelegationExpired(d.end, now);
}

export function deriveDelegationStatus(d, now = new Date()) {
  if (d.revoked) return { active: false, expired: false, status: "revoked" };
  if (isDelegationExpired(d.end, now)) return { active: false, expired: true, status: "expired" };
  const due = parseDay(d.end);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysLeft = Math.round((due.getTime() - today.getTime()) / 86400000);
  return { active: true, expired: false, status: "active", daysLeft };
}

export function checkCreateDelegationGate({ fromId, toId, end, perm } = {}) {
  if (!String(fromId || "").trim() || !String(toId || "").trim()) {
    return { ok: false, error: "DELEGATION_PARTIES_REQUIRED", reason: "المفوِّض والمفوَّض إليه مطلوبان.", reasonEn: "Delegator and delegate are required." };
  }
  if (String(fromId) === String(toId)) {
    return { ok: false, error: "SELF_DELEGATION_FORBIDDEN", reason: "لا تفويض إلى النفس.", reasonEn: "Cannot delegate to yourself." };
  }
  if (!String(perm || "").trim()) {
    return { ok: false, error: "DELEGATION_PERM_REQUIRED", reason: "الصلاحية المفوَّضة مطلوبة.", reasonEn: "Delegated permission is required." };
  }
  if (!parseDay(String(end || ""))) {
    return { ok: false, error: "DELEGATION_END_REQUIRED", reason: "تاريخ انتهاء التفويض مطلوب.", reasonEn: "Delegation end date is required." };
  }
  return { ok: true };
}

export function deriveEscalationFromBranches(branches = []) {
  return branches
    .filter((b) => b.managerId || b.managerName)
    .map((b) => ({
      branchId: b.id,
      branchName: b.name,
      managerId: b.managerId || null,
      managerName: b.managerName || null,
      region: b.region || null,
    }));
}

export function deriveOrgStats(branches = [], delegations = [], now = new Date()) {
  return {
    branches: branches.length,
    unassignedManagers: branches.filter((b) => !(b.managerId || b.managerName)).length,
    activeDelegations: delegations.filter((d) => isDelegationActive(d, now)).length,
  };
}
