/** Org structure — permissions & escalation derive from the tree.
 *  Design: NiroVera Platform.dc.html (org / PERMS / SCOPES / CYCLE / delegations).
 */

/** 0 none · 1 company · 2 own · 3 delegated (derived) · 4 station · 5 region */
export const SCOPE = {
  NONE: 0,
  COMPANY: 1,
  OWN: 2,
  DELEGATED: 3,
  STATION: 4,
  REGION: 5,
} as const;

export type ScopeCode = (typeof SCOPE)[keyof typeof SCOPE];

/** Click cycle for manual exceptions — never includes DELEGATED. */
export const SCOPE_CYCLE: ScopeCode[] = [
  SCOPE.NONE,
  SCOPE.OWN,
  SCOPE.STATION,
  SCOPE.REGION,
  SCOPE.COMPANY,
];

export const ORG_ROLES = [
  "ops_director",
  "station_manager",
  "supervisor",
  "safety",
  "employee",
] as const;

export type OrgRoleId = (typeof ORG_ROLES)[number];

export const ORG_SECTIONS = [
  "command",
  "operations",
  "attendance",
  "daily",
  "hse",
  "complaints",
  "leave",
  "hr",
  "payroll",
  "settings",
] as const;

export type OrgSectionId = (typeof ORG_SECTIONS)[number];

/**
 * Baseline matrix [section][role] — mirrors design PERMS.
 * Values: company / station / own / none / delegated placeholders.
 */
export const BASELINE_MATRIX: ScopeCode[][] = [
  // command
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  // operations
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  // attendance
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  // daily
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  // hse
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY],
  // complaints
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  // leave
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.NONE, SCOPE.OWN],
  // hr
  [SCOPE.COMPANY, SCOPE.DELEGATED, SCOPE.DELEGATED, SCOPE.DELEGATED, SCOPE.DELEGATED],
  // payroll
  [SCOPE.COMPANY, SCOPE.DELEGATED, SCOPE.COMPANY, SCOPE.DELEGATED, SCOPE.DELEGATED],
  // settings
  [SCOPE.COMPANY, SCOPE.NONE, SCOPE.NONE, SCOPE.NONE, SCOPE.NONE],
];

export type PermOverride = {
  key: string; // `${sectionIdx}:${roleIdx}`
  scope: ScopeCode;
  by?: string | null;
  at?: string | null;
};

export type DelegationLike = {
  id: string;
  fromId: string;
  toId: string;
  perm: string;
  reason?: string | null;
  end: string; // YYYY-MM-DD
  revoked?: boolean;
};

export type BranchLike = {
  id: string;
  name: string;
  region?: "west" | "east" | string;
  managerId?: string | null;
  managerName?: string | null;
  crew?: number;
  seeded?: boolean;
};

export type OrgNodeLike = {
  id: string;
  parentId?: string | null;
};

export function permKey(sectionIdx: number, roleIdx: number) {
  return `${sectionIdx}:${roleIdx}`;
}

export function parseDay(iso: string) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function baselineScope(sectionIdx: number, roleIdx: number): ScopeCode {
  const row = BASELINE_MATRIX[sectionIdx];
  if (!row || roleIdx < 0 || roleIdx >= row.length) return SCOPE.NONE;
  return row[roleIdx];
}

/** Effective cell: override wins unless baseline is DELEGATED and no override. */
export function effectiveScope(
  sectionIdx: number,
  roleIdx: number,
  overrides: Record<string, ScopeCode | PermOverride> = {},
): { scope: ScopeCode; derived: boolean; overridden: boolean; baseline: ScopeCode } {
  const baseline = baselineScope(sectionIdx, roleIdx);
  const key = permKey(sectionIdx, roleIdx);
  const raw = overrides[key];
  const overrideScope = raw == null
    ? null
    : typeof raw === "number"
      ? raw
      : (raw as PermOverride).scope;
  if (overrideScope != null && overrideScope !== SCOPE.DELEGATED) {
    return { scope: overrideScope as ScopeCode, derived: false, overridden: true, baseline };
  }
  return {
    scope: baseline,
    derived: baseline === SCOPE.DELEGATED,
    overridden: false,
    baseline,
  };
}

export function nextScopeInCycle(current: ScopeCode): ScopeCode {
  if (current === SCOPE.DELEGATED) return SCOPE.DELEGATED;
  const at = SCOPE_CYCLE.indexOf(current);
  if (at < 0) return SCOPE_CYCLE[0];
  return SCOPE_CYCLE[(at + 1) % SCOPE_CYCLE.length];
}

export function checkSetPermGate(nextScope: ScopeCode | number) {
  if (Number(nextScope) === SCOPE.DELEGATED) {
    return {
      ok: false as const,
      error: "DELEGATED_IS_DERIVED",
      reason: "«بتفويض» حالة مشتقة من سجل التفويض — لا تُضبط من المصفوفة.",
      reasonEn: "\"Delegated\" is derived from the delegation register — not set from the matrix.",
    };
  }
  if (![SCOPE.NONE, SCOPE.OWN, SCOPE.STATION, SCOPE.REGION, SCOPE.COMPANY].includes(Number(nextScope) as ScopeCode)) {
    return {
      ok: false as const,
      error: "INVALID_SCOPE",
      reason: "نطاق صلاحية غير معروف.",
      reasonEn: "Unknown permission scope.",
    };
  }
  return { ok: true as const, scope: Number(nextScope) as ScopeCode };
}

export function derivePermissionMatrix(overrides: Record<string, ScopeCode | PermOverride> = {}) {
  return ORG_SECTIONS.map((sectionId, si) => ({
    sectionId,
    cells: ORG_ROLES.map((roleId, ri) => {
      const cell = effectiveScope(si, ri, overrides);
      return { roleId, ...cell };
    }),
  }));
}

export function checkCreateBranchGate(input: { name?: string | null; managerId?: string | null; managerName?: string | null }) {
  const name = String(input.name || "").trim();
  const manager = String(input.managerId || input.managerName || "").trim();
  if (!name) {
    return { ok: false as const, error: "BRANCH_NAME_REQUIRED", reason: "اسم الفرع مطلوب.", reasonEn: "Branch name is required." };
  }
  if (!manager) {
    return { ok: false as const, error: "BRANCH_MANAGER_REQUIRED", reason: "مسؤول الفرع مطلوب.", reasonEn: "Branch manager is required." };
  }
  return { ok: true as const, name, manager };
}

/** True if placing nodeId under newParentId would create a cycle. */
export function wouldCreateCycle(nodes: OrgNodeLike[], nodeId: string, newParentId: string | null | undefined) {
  if (!newParentId) return false;
  if (newParentId === nodeId) return true;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let cursor: OrgNodeLike | undefined = byId.get(newParentId);
  const seen = new Set<string>();
  while (cursor) {
    if (cursor.id === nodeId) return true;
    if (seen.has(cursor.id)) return true;
    seen.add(cursor.id);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return false;
}

export function checkReparentGate(nodes: OrgNodeLike[], nodeId: string, newParentId: string | null | undefined) {
  if (!nodeId) {
    return { ok: false as const, error: "NODE_REQUIRED", reason: "العقدة مطلوبة.", reasonEn: "Node is required." };
  }
  if (!nodes.some((n) => n.id === nodeId)) {
    return { ok: false as const, error: "NODE_NOT_FOUND", reason: "العقدة غير موجودة.", reasonEn: "Node not found." };
  }
  if (newParentId && !nodes.some((n) => n.id === newParentId)) {
    return { ok: false as const, error: "PARENT_NOT_FOUND", reason: "الأب غير موجود.", reasonEn: "Parent not found." };
  }
  if (wouldCreateCycle(nodes, nodeId, newParentId)) {
    return {
      ok: false as const,
      error: "CYCLE_FORBIDDEN",
      reason: "لا يمكن جعل عقدة أبًا لنفسها أو لسلفها — الدورة ممنوعة.",
      reasonEn: "A node cannot be placed under itself or its descendant — cycles are forbidden.",
    };
  }
  return { ok: true as const };
}

export function isDelegationExpired(end: string, now: Date = new Date()) {
  const due = parseDay(end);
  if (!due) return true;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return due.getTime() < today.getTime();
}

export function isDelegationActive(d: DelegationLike, now: Date = new Date()) {
  return !d.revoked && !isDelegationExpired(d.end, now);
}

export function deriveDelegationStatus(d: DelegationLike, now: Date = new Date()) {
  if (d.revoked) return { active: false, expired: false, status: "revoked" as const };
  if (isDelegationExpired(d.end, now)) return { active: false, expired: true, status: "expired" as const };
  const due = parseDay(d.end)!;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysLeft = Math.round((due.getTime() - today.getTime()) / 86400000);
  return { active: true, expired: false, status: "active" as const, daysLeft };
}

export function checkCreateDelegationGate(input: {
  fromId?: string | null;
  toId?: string | null;
  end?: string | null;
  perm?: string | null;
}) {
  if (!String(input.fromId || "").trim() || !String(input.toId || "").trim()) {
    return {
      ok: false as const,
      error: "DELEGATION_PARTIES_REQUIRED",
      reason: "المفوِّض والمفوَّض إليه مطلوبان.",
      reasonEn: "Delegator and delegate are required.",
    };
  }
  if (String(input.fromId) === String(input.toId)) {
    return {
      ok: false as const,
      error: "SELF_DELEGATION_FORBIDDEN",
      reason: "لا تفويض إلى النفس.",
      reasonEn: "Cannot delegate to yourself.",
    };
  }
  if (!String(input.perm || "").trim()) {
    return {
      ok: false as const,
      error: "DELEGATION_PERM_REQUIRED",
      reason: "الصلاحية المفوَّضة مطلوبة.",
      reasonEn: "Delegated permission is required.",
    };
  }
  if (!parseDay(String(input.end || ""))) {
    return {
      ok: false as const,
      error: "DELEGATION_END_REQUIRED",
      reason: "تاريخ انتهاء التفويض مطلوب.",
      reasonEn: "Delegation end date is required.",
    };
  }
  return { ok: true as const };
}

/**
 * Escalation hops derived from branch managers — changing a manager moves
 * the chain immediately (no second place to update).
 */
export function deriveEscalationFromBranches(branches: BranchLike[]) {
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

export function deriveOrgStats(branches: BranchLike[], delegations: DelegationLike[], now: Date = new Date()) {
  const activeDg = delegations.filter((d) => isDelegationActive(d, now)).length;
  const unassigned = branches.filter((b) => !(b.managerId || b.managerName)).length;
  return {
    branches: branches.length,
    unassignedManagers: unassigned,
    activeDelegations: activeDg,
  };
}
