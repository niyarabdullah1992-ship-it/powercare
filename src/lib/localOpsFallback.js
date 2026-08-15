/**
 * Local operations board when base44.functions.operations is unreachable
 * (local preview / offline). Uses company store tasks + opsDerivations —
 * same weight → points rules as the server path.
 */
import {
  clampEffortWeight,
  deriveHorizonGroups,
  deriveOpsCounts,
  applyOpsReject,
  applyOpsReassign,
  checkReassignGate,
  nextOpsEscalation,
  planHorizonFromDue,
  taskAssigneeId,
  taskPoints,
} from "@/lib/opsDerivations";
import { getCompanyData, updateCompany } from "@/lib/store";

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-3)}`;
}

export function normalizeLocalTask(raw, index = 0) {
  if (!raw || typeof raw !== "object") return null;
  const effortWeight = clampEffortWeight(raw.effortWeight ?? raw.weight ?? 3);
  const priority = raw.priority || "medium";
  const targetCount = Math.max(1, Number(raw.targetCount ?? raw.task_target) || 1);
  const completedCount = Math.max(0, Number(raw.completedCount ?? raw.completed_tasks) || 0);
  const dueAt = raw.dueAt || raw.dueDate || null;
  const status = raw.status === "pending" ? "active" : (raw.status || "active");
  return {
    id: raw.id || uid("tk"),
    ref: raw.ref || `LOC-${String(index + 1).padStart(3, "0")}`,
    title: raw.title || "—",
    stationId: raw.stationId || null,
    ownerId: raw.ownerId || raw.assignedTo || null,
    originalOwnerId: raw.originalOwnerId || raw.ownerId || raw.assignedTo || null,
    assignmentHistory: Array.isArray(raw.assignmentHistory) ? raw.assignmentHistory : [],
    memberIds: Array.isArray(raw.memberIds) ? raw.memberIds : [],
    assignMode: raw.assignMode || "one",
    priority,
    effortWeight,
    workKind: raw.workKind || "pm",
    mode: raw.mode || "onsite",
    dueAt,
    targetCount,
    completedCount,
    status,
    planPinned: !!raw.planPinned,
    planHorizon: raw.planHorizon || (dueAt ? planHorizonFromDue(dueAt) : "w"),
    steps: raw.steps || "",
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    comments: Array.isArray(raw.comments) ? raw.comments : [],
    proofFiles: Array.isArray(raw.proofFiles) ? raw.proofFiles : [],
    attestation: raw.attestation || "",
    createdBy: raw.createdBy || null,
    rejectReason: raw.rejectReason || "",
    escalationLevel: Number(raw.escalationLevel) || 0,
    escalatedAt: raw.escalatedAt || null,
    approvedAt: raw.approvedAt || null,
    completedAt: raw.completedAt || null,
    closedAt: raw.closedAt || null,
    updatedAt: raw.updatedAt || null,
    pointsAwarded: Number(raw.pointsAwarded) || 0,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function buildLocalOpsBoard({ tasks, scope = "all" } = {}) {
  const raw = Array.isArray(tasks) ? tasks : [];
  let normalized = raw.map((t, i) => normalizeLocalTask(t, i)).filter(Boolean);
  if (scope && scope !== "all") {
    const sid = String(scope);
    normalized = normalized.filter((t) => !t.stationId || String(t.stationId) === sid);
  }
  return {
    tasks: normalized,
    counts: deriveOpsCounts(normalized),
    horizons: deriveHorizonGroups(normalized),
    source: "local",
  };
}

export function createLocalOpsTask(companyId, input, { employees = [] } = {}) {
  const data = updateCompany(companyId, (d) => {
    const list = Array.isArray(d.tasks) ? d.tasks : [];
    const owner = (employees || []).find((e) => e.id === input.ownerId);
    const task = normalizeLocalTask({
      id: uid("tk"),
      ref: `LOC-${String(list.length + 1).padStart(3, "0")}`,
      title: input.title,
      stationId: input.stationId || null,
      ownerId: input.ownerId || null,
      originalOwnerId: input.ownerId || null,
      assignmentHistory: [],
      memberIds: input.memberIds || [],
      assignMode: input.assignMode || "one",
      priority: input.priority || "medium",
      effortWeight: input.effortWeight ?? 3,
      workKind: input.workKind || "pm",
      mode: input.mode || "onsite",
      dueAt: input.dueAt || null,
      targetCount: input.targetCount || 1,
      completedCount: 0,
      status: "active",
      planPinned: !!input.planPinned,
      planHorizon: input.planHorizon || "w",
      steps: input.steps || "",
      attachments: input.attachments || [],
      assignedTo: input.ownerId || null,
      ownerName: owner?.name,
      createdAt: new Date().toISOString(),
    }, list.length);
    d.tasks = [task, ...list];
  }, { sync: "tasks" });
  return buildLocalOpsBoard({ tasks: data?.tasks || [], scope: "all" });
}

export function mutateLocalOpsTask(companyId, taskId, mutator, { seed } = {}) {
  const data = updateCompany(companyId, (d) => {
    const list = Array.isArray(d.tasks) ? d.tasks : [];
    const idx = list.findIndex((t) => String(t.id) === String(taskId));
    if (idx < 0) {
      if (!seed) return;
      const n = normalizeLocalTask({ ...seed, id: taskId, companyId });
      d.tasks = [mutator(n) || n, ...list];
      return;
    }
    d.tasks = list.map((t) => {
      if (String(t.id) !== String(taskId)) return t;
      const n = normalizeLocalTask(t);
      return mutator(n) || n;
    });
  }, { sync: "tasks" });
  return buildLocalOpsBoard({ tasks: data?.tasks || [], scope: "all" });
}

export function logLocalCompletion(companyId, taskId, { amount = 1, attestation = "", proofFiles = [] } = {}) {
  return mutateLocalOpsTask(companyId, taskId, (t) => {
    const next = Math.min(t.targetCount, t.completedCount + Math.max(1, amount));
    const awaiting = next >= t.targetCount;
    return {
      ...t,
      completedCount: next,
      completed_tasks: next,
      attestation: attestation || t.attestation,
      proofFiles: [...(t.proofFiles || []), ...proofFiles],
      status: awaiting ? "awaiting_approval" : t.status,
      escalationLevel: awaiting ? 0 : t.escalationLevel,
    };
  });
}

export function approveLocalTask(companyId, taskId) {
  let awarded = 0;
  const board = mutateLocalOpsTask(companyId, taskId, (t) => {
    awarded = taskPoints(t.priority, t.effortWeight);
    return {
      ...t,
      status: "completed",
      approvedAt: new Date().toISOString(),
      pointsAwarded: awarded,
      completedCount: Math.max(t.completedCount, t.targetCount),
    };
  });
  return { ...board, awarded: { points: awarded } };
}

export function reassignLocalOpsTask(companyId, taskId, { toId, reason, reviewer, data, employees = [], lang = "ar", task } = {}) {
  const people = (employees || []).map((e) => ({
    employeeId: e.employeeId || e.id,
    id: e.id || e.employeeId,
    name: e.name,
  }));
  const current = (getCompanyData(companyId)?.tasks || []).find((t) => String(t.id) === String(taskId))
    || (task && String(task.id) === String(taskId) ? task : null);
  const preview = current ? normalizeLocalTask(current) : { status: "active", ownerId: null, assignMode: "one" };
  const gate = checkReassignGate({
    task: preview,
    user: reviewer,
    data,
    toId,
    reason,
    people,
    lang,
  });
  if (!gate.ok) {
    const err = new Error(gate.reason || gate.error);
    err.code = gate.error;
    throw err;
  }
  return mutateLocalOpsTask(companyId, taskId, (t) => {
    const fromId = taskAssigneeId(t);
    const fromPerson = people.find((p) => String(p.employeeId || p.id) === String(fromId));
    const toPerson = people.find((p) => String(p.employeeId || p.id) === String(toId));
    return applyOpsReassign(t, {
      fromId,
      toId,
      byId: reviewer?.id || reviewer?.employeeId || null,
      reason,
      fromName: fromPerson?.name || "",
      toName: toPerson?.name || "",
      byName: reviewer?.name || "",
      lang,
    });
  }, { seed: current });
}

export function rejectLocalTask(companyId, taskId, reason, { reviewer, data } = {}) {
  let escalation = { escalate: false, atTop: true, nextLevel: 0 };
  const board = mutateLocalOpsTask(companyId, taskId, (t) => {
    const next = nextOpsEscalation(t, data, reviewer?.id || reviewer?.employeeId);
    escalation = next;
    return applyOpsReject(t, {
      reason,
      escalate: next.escalate,
      nextLevel: next.nextLevel,
      reviewerId: reviewer?.id || reviewer?.employeeId || null,
      reviewerName: reviewer?.name || "",
    });
  });
  return { ...board, escalation };
}
