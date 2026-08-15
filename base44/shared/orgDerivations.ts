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
  "work_proof",
  "signing",
  "reports",
  "chat",
  "shifts",
  "hiring",
  "performance",
  "org",
  "expenses",
  "inventory",
  "files",
  "assistant",
] as const;

export type OrgSectionId = (typeof ORG_SECTIONS)[number];

/** Legacy matrix ids → live grant ids in smartPositions. */
export const ORG_TO_SMART_SECTION: Record<string, string> = {
  operations: "tasks",
  daily: "daily_report",
  hse: "safety",
};

export function canonicalSectionId(sectionId: string): string {
  return ORG_TO_SMART_SECTION[sectionId] || sectionId;
}

export const ORG_SECTION_LABELS: Record<OrgSectionId, { ar: string; en: string }> = {
  command: { ar: "مركز القيادة", en: "Command Center" },
  operations: { ar: "المهام والعمليات", en: "Operations" },
  attendance: { ar: "الحضور والانصراف", en: "Attendance" },
  daily: { ar: "التقرير اليومي", en: "Daily report" },
  hse: { ar: "السلامة HSE", en: "Safety HSE" },
  complaints: { ar: "صوت الموظف", en: "Employee Voice" },
  leave: { ar: "طلبات الإجازة", en: "Leave requests" },
  hr: { ar: "الموارد البشرية", en: "Human Resources" },
  payroll: { ar: "الرواتب", en: "Payroll" },
  settings: { ar: "إعدادات الشركة", en: "Company settings" },
  work_proof: { ar: "إثبات العمل", en: "Work proof" },
  signing: { ar: "التوقيع الرقمي", en: "Digital signing" },
  reports: { ar: "التقارير والتحليلات", en: "Reports & analytics" },
  chat: { ar: "المحادثات التشغيلية", en: "Operations chat" },
  shifts: { ar: "الورديات", en: "Shifts" },
  hiring: { ar: "التوظيف", en: "Recruitment" },
  performance: { ar: "الأداء", en: "Performance" },
  org: { ar: "الهيكل التنظيمي", en: "Org structure" },
  expenses: { ar: "المصروفات", en: "Expenses" },
  inventory: { ar: "المخزون والأصول", en: "Inventory & assets" },
  files: { ar: "الملفات", en: "Files" },
  assistant: { ar: "المساعد الذكي", en: "AI assistant" },
};

/**
 * Baseline matrix [section][role]. First 10 rows keep their indexes so saved overrides stay valid.
 */
export const BASELINE_MATRIX: ScopeCode[][] = [
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.NONE, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.NONE, SCOPE.NONE, SCOPE.NONE, SCOPE.NONE],
  [SCOPE.COMPANY, SCOPE.NONE, SCOPE.COMPANY, SCOPE.NONE, SCOPE.NONE],
  [SCOPE.COMPANY, SCOPE.NONE, SCOPE.NONE, SCOPE.NONE, SCOPE.NONE],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.NONE, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.NONE, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.NONE, SCOPE.NONE, SCOPE.NONE, SCOPE.NONE],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.NONE, SCOPE.NONE, SCOPE.NONE, SCOPE.NONE],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.NONE, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.NONE, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
  [SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.COMPANY, SCOPE.OWN],
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
  /** Optional free-text org group (SAP-style). Not a forced East/West enum. */
  group?: string | null;
  /** @deprecated use group — kept for older payloads */
  region?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  crew?: number;
  seeded?: boolean;
};

export type OrgNodeLike = {
  id: string;
  parentId?: string | null;
  type?: string;
  refId?: string;
  title?: string;
};

export type BranchEscalationStep = {
  employeeId: string;
  name: string;
  title: string;
  role: string;
};

export const EMPLOYEE_ROLE_IDX = ORG_ROLES.indexOf("employee");

const BUILTIN_TITLE_ALIASES = new Set([
  "ops_director", "station_manager", "supervisor", "safety", "employee",
  "مدير عمليات", "مدير فرع", "مشرف", "سلامة", "موظف",
  "ops director", "station mgr", "branch manager",
].map((s) => s.toLocaleLowerCase("ar")));

export type JobTitleCol = { id: string; label: string; count?: number };

export function normalizeJobTitle(title: unknown) {
  return String(title || "").trim().replace(/\s+/g, " ");
}

export function titleSlug(title: unknown) {
  return normalizeJobTitle(title).toLocaleLowerCase("ar");
}

export function titlePermKey(sectionIdx: number, titleId: unknown) {
  return `${sectionIdx}:title:${titleSlug(titleId)}`;
}

export function checkRemoveTitleGate(titleKey: unknown) {
  const id = titleSlug(titleKey);
  if (!id) {
    return { ok: false as const, error: "TITLE_REQUIRED", reason: "المسمى مطلوب.", reasonEn: "A job title is required." };
  }
  if (BUILTIN_TITLE_ALIASES.has(id) || (ORG_ROLES as readonly string[]).includes(id)) {
    return {
      ok: false as const,
      error: "SYSTEM_TITLE",
      reason: "لا يُحذف المسمى النظامي من المصفوفة.",
      reasonEn: "A system role cannot be removed from the matrix.",
    };
  }
  return { ok: true as const, id };
}

export function collectJobTitles(data: {
  employees?: Array<{ profile?: { position?: string }; position?: string; jobTitle?: string; title?: string }>;
  orgTree?: Array<{ type?: string; title?: string }>;
  smartPositions?: Array<{ title?: string }>;
  hcmFoundation?: { jobs?: Array<{ title?: string }> };
  knownTitles?: unknown[];
} = {}, removed: unknown[] = []): JobTitleCol[] {
  const blocked = new Set((removed || []).map((item) => titleSlug(item)).filter(Boolean));
  const seen = new Map<string, JobTitleCol>();
  const add = (raw: unknown) => {
    const label = normalizeJobTitle(raw);
    if (!label) return;
    const id = titleSlug(label);
    if (!id || BUILTIN_TITLE_ALIASES.has(id) || blocked.has(id)) return;
    const prev = seen.get(id);
    if (prev) prev.count = (prev.count || 0) + 1;
    else seen.set(id, { id, label, count: 1 });
  };
  for (const employee of data.employees || []) {
    add(employee.profile?.position || employee.position || employee.jobTitle || employee.title);
  }
  for (const node of data.orgTree || []) {
    if (node.type === "employee") add(node.title);
  }
  for (const position of data.smartPositions || []) add(position.title);
  for (const job of data.hcmFoundation?.jobs || []) add(job.title);
  for (const label of data.knownTitles || []) {
    const normalized = normalizeJobTitle(label);
    const id = titleSlug(normalized);
    if (!id || BUILTIN_TITLE_ALIASES.has(id) || blocked.has(id) || seen.has(id)) continue;
    seen.set(id, { id, label: normalized, count: 0 });
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label, "ar"));
}

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

export function grantableScope(scope: ScopeCode | number): ScopeCode {
  return Number(scope) === SCOPE.DELEGATED ? SCOPE.NONE : Number(scope) as ScopeCode;
}

/** Effective cell — every scope is grantable; legacy delegated reads as none. */
export function effectiveScope(
  sectionIdx: number,
  roleIdx: number,
  overrides: Record<string, ScopeCode | PermOverride> = {},
): { scope: ScopeCode; derived: boolean; overridden: boolean; baseline: ScopeCode } {
  const baseline = grantableScope(baselineScope(sectionIdx, roleIdx));
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
    derived: false,
    overridden: false,
    baseline,
  };
}

export function nextScopeInCycle(current: ScopeCode): ScopeCode {
  const at = SCOPE_CYCLE.indexOf(grantableScope(current));
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

export function effectiveTitleScope(
  sectionIdx: number,
  titleId: string,
  overrides: Record<string, ScopeCode | PermOverride> = {},
): { scope: ScopeCode; derived: boolean; overridden: boolean; baseline: ScopeCode } {
  const baseline = grantableScope(baselineScope(sectionIdx, EMPLOYEE_ROLE_IDX));
  const key = titlePermKey(sectionIdx, titleId);
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
    derived: false,
    overridden: false,
    baseline,
  };
}

function normalizedTitles(titles: Array<string | JobTitleCol> = []): JobTitleCol[] {
  const seen = new Set<string>();
  const out: JobTitleCol[] = [];
  for (const item of titles) {
    const label = normalizeJobTitle(typeof item === "string" ? item : item?.label || item?.id);
    const id = titleSlug(typeof item === "string" ? item : item?.id || label);
    if (!id || seen.has(id) || BUILTIN_TITLE_ALIASES.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      label: label || id,
      count: typeof item === "object" ? Number(item?.count) || 0 : 0,
    });
  }
  return out;
}

export function derivePermissionMatrix(
  overrides: Record<string, ScopeCode | PermOverride> = {},
  titles: Array<string | JobTitleCol> = [],
) {
  const extra = normalizedTitles(titles);
  return ORG_SECTIONS.map((sectionId, si) => ({
    sectionId,
    cells: [
      ...ORG_ROLES.map((roleId, ri) => {
        const cell = effectiveScope(si, ri, overrides);
        return { roleId, ...cell };
      }),
      ...extra.map((title) => ({
        roleId: `title:${title.id}`,
        titleKey: title.label,
        ...effectiveTitleScope(si, title.id, overrides),
      })),
    ],
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
    .map((b) => {
      const group = String(b.group || (b.region !== "west" && b.region !== "east" ? b.region : "") || "").trim() || null;
      return {
        branchId: b.id,
        branchName: b.name,
        managerId: b.managerId || null,
        managerName: b.managerName || null,
        group,
        region: group, // legacy alias
      };
    });
}

type EscalationData = {
  employees?: Array<{ id?: string; employeeId?: string; name?: string; role?: string; stationId?: string | null; managedStations?: string[]; isOwner?: boolean; position?: string; profile?: { position?: string } }>;
  orgTree?: OrgNodeLike[];
  stations?: Array<{ id?: string; stationId?: string; managerId?: string | null }>;
  ownerId?: string;
  directorId?: string;
  branchEscalationChains?: Record<string, string[]>;
};

function employeeIndex(employees: EscalationData["employees"] = []) {
  const empById = new Map<string, NonNullable<EscalationData["employees"]>[number]>();
  for (const e of employees) {
    const id = e.id || e.employeeId;
    if (id) empById.set(String(id), e);
  }
  return empById;
}

function stepFromEmp(emp: NonNullable<EscalationData["employees"]>[number], title?: string): BranchEscalationStep {
  return {
    employeeId: String(emp.id || emp.employeeId || ""),
    name: emp.name || "",
    title: title || emp.profile?.position || emp.position || "",
    role: emp.role || "",
  };
}

export function deriveAutoBranchEscalationChain(
  stationId: string | null | undefined,
  data?: EscalationData | null,
): BranchEscalationStep[] {
  const employees = Array.isArray(data?.employees) ? data.employees : [];
  const nodes = Array.isArray(data?.orgTree) ? data.orgTree : [];
  const stations = Array.isArray(data?.stations) ? data.stations : [];
  const empById = new Map<string, (typeof employees)[number]>();
  for (const e of employees) {
    const id = e.id || e.employeeId;
    if (id) empById.set(String(id), e);
  }
  const byNodeId = new Map(nodes.map((n) => [n.id, n]));
  const chain: BranchEscalationStep[] = [];
  const seen = new Set<string>();

  const pushEmp = (emp: (typeof employees)[number] | undefined, title?: string) => {
    if (!emp) return;
    const id = String(emp.id || emp.employeeId || "");
    if (!id || seen.has(id)) return;
    seen.add(id);
    chain.push({
      employeeId: id,
      name: emp.name || "",
      title: title || emp.profile?.position || emp.position || "",
      role: emp.role || "",
    });
  };

  const sid = stationId ? String(stationId) : "";
  if (!sid) return chain;

  const station = stations.find((s) => String(s.id || s.stationId) === sid) || null;
  const stationNode = nodes.find((n) => n.type === "station" && String(n.refId) === sid) || null;

  if (station?.managerId) {
    pushEmp(empById.get(String(station.managerId)), "مدير الفرع");
  } else {
    const localMgr = employees.find((e) => e.role === "station_manager" && String(e.stationId) === sid);
    pushEmp(localMgr, "مدير الفرع");
  }

  const walkUp = (start: OrgNodeLike | undefined | null) => {
    let cursor = start || undefined;
    const visited = new Set<string>();
    while (cursor) {
      if (visited.has(cursor.id)) break;
      visited.add(cursor.id);
      if (cursor.type === "station" && String(cursor.refId) !== sid) break;
      if (cursor.type === "employee") {
        pushEmp(empById.get(String(cursor.refId || "")), cursor.title || "");
      }
      cursor = cursor.parentId ? byNodeId.get(cursor.parentId) : undefined;
    }
  };

  if (stationNode) {
    walkUp(stationNode.parentId ? byNodeId.get(stationNode.parentId) : null);
  } else if (station?.managerId) {
    const mgrNode = nodes.find((n) => n.type === "employee" && String(n.refId) === String(station.managerId));
    walkUp(mgrNode?.parentId ? byNodeId.get(mgrNode.parentId) : null);
  }

  const owner = employees.find((e) => e.isOwner || e.role === "owner" || String(e.id) === String(data?.ownerId));
  if (owner) pushEmp(owner, "المالك");

  return chain;
}

/** Per-branch escalation: custom order if edited, otherwise the tree path. */
export function deriveBranchEscalationChain(
  stationId: string | null | undefined,
  data?: EscalationData | null,
): BranchEscalationStep[] {
  const sid = stationId ? String(stationId) : "";
  const manual = data?.branchEscalationChains?.[sid];
  if (!Array.isArray(manual)) return deriveAutoBranchEscalationChain(sid, data);
  const empById = employeeIndex(data?.employees);
  const chain: BranchEscalationStep[] = [];
  const seen = new Set<string>();
  for (const raw of manual) {
    const id = String(raw);
    const emp = empById.get(id);
    if (!emp || seen.has(id)) continue;
    seen.add(id);
    chain.push(stepFromEmp(emp));
  }
  return chain;
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
