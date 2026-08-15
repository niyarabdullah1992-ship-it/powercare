/** Client mirror of base44/shared/orgDerivations.ts */

export const SCOPE = { NONE: 0, COMPANY: 1, OWN: 2, DELEGATED: 3, STATION: 4, REGION: 5 };
export const SCOPE_CYCLE = [SCOPE.NONE, SCOPE.OWN, SCOPE.STATION, SCOPE.REGION, SCOPE.COMPANY];
export const ORG_ROLES = ["ops_director", "station_manager", "supervisor", "safety", "employee"];
export const ORG_SECTIONS = [
  "command", "operations", "attendance", "daily", "hse", "complaints", "leave", "hr", "payroll", "settings",
  "work_proof", "signing", "reports", "chat", "shifts", "hiring", "performance", "org", "expenses", "inventory", "files", "assistant",
];

export const ORG_SECTION_LABELS = {
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

export const BASELINE_MATRIX = [
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

export const EMPLOYEE_ROLE_IDX = ORG_ROLES.indexOf("employee");

const BUILTIN_TITLE_ALIASES = new Set([
  "ops_director", "station_manager", "supervisor", "safety", "employee",
  "مدير عمليات", "مدير فرع", "مشرف", "سلامة", "موظف",
  "ops director", "station mgr", "branch manager",
].map((s) => s.toLocaleLowerCase("ar")));

export function normalizeJobTitle(title) {
  return String(title || "").trim().replace(/\s+/g, " ");
}

export function titleSlug(title) {
  return normalizeJobTitle(title).toLocaleLowerCase("ar");
}

export function titlePermKey(sectionIdx, titleId) {
  return `${sectionIdx}:title:${titleSlug(titleId)}`;
}

export function checkRemoveTitleGate(titleKey) {
  const id = titleSlug(titleKey);
  if (!id) {
    return { ok: false, error: "TITLE_REQUIRED", reason: "المسمى مطلوب.", reasonEn: "A job title is required." };
  }
  if (BUILTIN_TITLE_ALIASES.has(id) || ORG_ROLES.includes(id)) {
    return {
      ok: false,
      error: "SYSTEM_TITLE",
      reason: "لا يُحذف المسمى النظامي من المصفوفة.",
      reasonEn: "A system role cannot be removed from the matrix.",
    };
  }
  return { ok: true, id };
}

export function stripJobTitleFromData(data = {}, titleKey) {
  const gate = checkRemoveTitleGate(titleKey);
  if (!gate.ok) return 0;
  const id = gate.id;
  let cleared = 0;
  const matches = (raw) => titleSlug(raw) === id;
  for (const employee of data.employees || []) {
    if (employee.profile && matches(employee.profile.position)) {
      employee.profile.position = "";
      cleared += 1;
    }
    if (matches(employee.position)) employee.position = "";
    if (matches(employee.jobTitle)) employee.jobTitle = "";
    if (matches(employee.title)) employee.title = "";
  }
  for (const node of data.orgTree || []) {
    if (node.type === "employee" && matches(node.title)) {
      node.title = "";
      cleared += 1;
    }
  }
  for (const position of data.smartPositions || []) {
    if (matches(position.title)) {
      position.title = "";
      cleared += 1;
    }
  }
  return cleared;
}

export function collectJobTitles(data = {}, removed = []) {
  const blocked = new Set((removed || []).map((item) => titleSlug(item)).filter(Boolean));
  const seen = new Map();
  const add = (raw) => {
    const label = normalizeJobTitle(raw);
    if (!label) return;
    const id = titleSlug(label);
    if (!id || BUILTIN_TITLE_ALIASES.has(id) || blocked.has(id)) return;
    const prev = seen.get(id);
    if (prev) prev.count += 1;
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
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label, "ar"));
}

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

export function grantableScope(scope) {
  return Number(scope) === SCOPE.DELEGATED ? SCOPE.NONE : Number(scope);
}

export function effectiveScope(sectionIdx, roleIdx, overrides = {}) {
  const baseline = grantableScope(baselineScope(sectionIdx, roleIdx));
  const key = permKey(sectionIdx, roleIdx);
  const raw = overrides[key];
  const overrideScope = raw == null ? null : typeof raw === "number" ? raw : raw.scope;
  if (overrideScope != null && overrideScope !== SCOPE.DELEGATED) {
    return { scope: overrideScope, derived: false, overridden: true, baseline };
  }
  return { scope: baseline, derived: false, overridden: false, baseline };
}

export function nextScopeInCycle(current) {
  const at = SCOPE_CYCLE.indexOf(grantableScope(current));
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

export function effectiveTitleScope(sectionIdx, titleId, overrides = {}) {
  const baseline = grantableScope(baselineScope(sectionIdx, EMPLOYEE_ROLE_IDX));
  const key = titlePermKey(sectionIdx, titleId);
  const raw = overrides[key];
  const overrideScope = raw == null ? null : typeof raw === "number" ? raw : raw.scope;
  if (overrideScope != null && overrideScope !== SCOPE.DELEGATED) {
    return { scope: overrideScope, derived: false, overridden: true, baseline };
  }
  return { scope: baseline, derived: false, overridden: false, baseline };
}

function normalizedTitles(titles = []) {
  const seen = new Set();
  const out = [];
  for (const item of titles) {
    const label = normalizeJobTitle(typeof item === "string" ? item : item?.label || item?.id);
    const id = titleSlug(typeof item === "string" ? item : item?.id || label);
    if (!id || seen.has(id) || BUILTIN_TITLE_ALIASES.has(id)) continue;
    seen.add(id);
    out.push({ id, label: label || id, count: Number(item?.count) || 0 });
  }
  return out;
}

export function derivePermissionMatrix(overrides = {}, titles = []) {
  const extra = normalizedTitles(titles);
  return ORG_SECTIONS.map((sectionId, si) => ({
    sectionId,
    cells: [
      ...ORG_ROLES.map((roleId, ri) => ({ roleId, ...effectiveScope(si, ri, overrides) })),
      ...extra.map((title) => ({
        roleId: `title:${title.id}`,
        titleKey: title.label,
        ...effectiveTitleScope(si, title.id, overrides),
      })),
    ],
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
    .map((b) => {
      const legacy = b.region === "west" || b.region === "east";
      const group = String(b.group || b.orgGroup || (legacy ? "" : b.region) || "").trim() || null;
      return {
        branchId: b.id,
        branchName: b.name,
        managerId: b.managerId || null,
        managerName: b.managerName || null,
        group,
        region: group,
      };
    });
}

function employeeIndex(employees = []) {
  const empById = new Map();
  for (const e of employees) {
    const id = e.id || e.employeeId;
    if (id) empById.set(String(id), e);
  }
  return empById;
}

function stepFromEmp(emp, title) {
  return {
    employeeId: String(emp.id || emp.employeeId || ""),
    name: emp.name || "",
    title: title || emp.profile?.position || emp.position || "",
    role: emp.role || "",
  };
}

/** Manual ladders keyed by station id. Accepts object or persisted array. */
export function branchEscalationMap(data) {
  const raw = data?.branchEscalationChains;
  if (!raw) return {};
  if (Array.isArray(raw)) {
    const out = {};
    for (const row of raw) {
      const sid = String(row?.stationId || row?.id || "");
      const ids = row?.employeeIds || row?.ids;
      if (sid && Array.isArray(ids)) out[sid] = ids.map(String);
    }
    return out;
  }
  return Object.fromEntries(
    Object.entries(raw).map(([sid, ids]) => [String(sid), Array.isArray(ids) ? ids.map(String) : []]),
  );
}

export function serializeBranchEscalationMap(map) {
  return Object.entries(map || {}).map(([stationId, employeeIds]) => ({
    id: stationId,
    stationId,
    employeeIds: Array.isArray(employeeIds) ? employeeIds.map(String) : [],
  }));
}

/** Manual list for a branch, if the user has customized that branch's ladder. */
export function manualBranchEscalationIds(stationId, data) {
  const sid = stationId ? String(stationId) : "";
  if (!sid) return null;
  const map = branchEscalationMap(data);
  return Object.prototype.hasOwnProperty.call(map, sid) ? map[sid] : null;
}

/** Resolved employee ids for a branch ladder (manual or auto). */
export function branchEscalationIds(stationId, data) {
  return deriveBranchEscalationChain(stationId, data).map((step) => String(step.employeeId));
}

/**
 * Auto ladder from the org tree only — no manual overrides.
 */
export function deriveAutoBranchEscalationChain(stationId, data) {
  const employees = Array.isArray(data?.employees) ? data.employees : [];
  const nodes = Array.isArray(data?.orgTree) ? data.orgTree : [];
  const stations = Array.isArray(data?.stations) ? data.stations : [];
  const empById = employeeIndex(employees);
  const byNodeId = new Map(nodes.map((n) => [n.id, n]));
  const chain = [];
  const seen = new Set();

  const pushEmp = (emp, title) => {
    if (!emp) return;
    const id = String(emp.id || emp.employeeId || "");
    if (!id || seen.has(id)) return;
    seen.add(id);
    chain.push(stepFromEmp(emp, title));
  };

  const sid = stationId ? String(stationId) : "";
  if (!sid) return chain;

  const station = stations.find((s) => String(s.id || s.stationId) === sid) || null;
  const stationNode = nodes.find((n) => n.type === "station" && String(n.refId) === sid) || null;

  // Only this branch's own manager — never a manager of another branch
  // who happens to list this station in managedStations.
  if (station?.managerId) {
    pushEmp(empById.get(String(station.managerId)), "مدير الفرع");
  } else {
    const localMgr = employees.find((e) => e.role === "station_manager" && String(e.stationId) === sid);
    pushEmp(localMgr, "مدير الفرع");
  }

  const walkUp = (start) => {
    let cursor = start;
    const visited = new Set();
    while (cursor) {
      if (visited.has(cursor.id)) break;
      visited.add(cursor.id);
      if (cursor.type === "station" && String(cursor.refId) !== sid) break;
      if (cursor.type === "employee") {
        pushEmp(empById.get(String(cursor.refId)), cursor.title || "");
      }
      cursor = cursor.parentId ? byNodeId.get(cursor.parentId) : null;
    }
  };

  if (stationNode) {
    walkUp(stationNode.parentId ? byNodeId.get(stationNode.parentId) : null);
  } else if (station?.managerId) {
    const mgrNode = nodes.find((n) => n.type === "employee" && String(n.refId) === String(station.managerId));
    walkUp(mgrNode?.parentId ? byNodeId.get(mgrNode.parentId) : null);
  }

  // Apex is the company owner only. A "director" seated under another
  // branch is that branch's path, not this one's extra step.
  const owner = employees.find((e) => e.isOwner || e.role === "owner" || String(e.id) === String(data?.ownerId));
  if (owner) pushEmp(owner, "المالك");

  return chain;
}

/**
 * Per-branch escalation: custom order if edited, otherwise the tree path.
 */
export function deriveBranchEscalationChain(stationId, data) {
  const sid = stationId ? String(stationId) : "";
  const manual = manualBranchEscalationIds(sid, data);
  if (!manual) return deriveAutoBranchEscalationChain(sid, data);
  const empById = employeeIndex(data?.employees);
  const chain = [];
  const seen = new Set();
  for (const id of manual) {
    const emp = empById.get(id);
    if (!emp || seen.has(id)) continue;
    seen.add(id);
    chain.push(stepFromEmp(emp));
  }
  return chain;
}

/** Station ids whose escalation ladder includes this employee. */
export function escalationStationsForEmployee(employeeId, data) {
  const eid = String(employeeId || "");
  if (!eid) return [];
  return (data?.stations || [])
    .map((s) => String(s.id || s.stationId || ""))
    .filter(Boolean)
    .filter((sid) => deriveBranchEscalationChain(sid, data).some((step) => String(step.employeeId) === eid));
}

export function sharedEscalationLabel(stationCount, ar, level) {
  const n = Number(level) || 0;
  if (!n || stationCount < 2) return "";
  if (stationCount >= 3) return ar ? `تصعيد ${n} · كل الفروع` : `Escalation ${n} · all branches`;
  return ar ? `تصعيد ${n} · فرعين` : `Escalation ${n} · 2 branches`;
}

export function deriveOrgStats(branches = [], delegations = [], now = new Date()) {
  return {
    branches: branches.length,
    unassignedManagers: branches.filter((b) => !(b.managerId || b.managerName)).length,
    activeDelegations: delegations.filter((d) => isDelegationActive(d, now)).length,
  };
}
