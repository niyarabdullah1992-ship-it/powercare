import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";
import { authPowerCareSession } from "../../shared/powerCareSession.ts";
import {
  checkAssignGate,
  clampEffortWeight,
  deriveOpsCounts,
  planHorizonFromDue,
  taskPoints,
  type AssignMode,
} from "../../shared/opsDerivations.ts";

const TASKS_CATEGORY = "operationsTasks";
const COMPETENCY_CATEGORY = "competencyCerts";

function requireCompanyId(companyId: unknown) {
  const id = typeof companyId === "string" ? companyId.trim() : "";
  if (!id) return null;
  return id;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const action = String(body.action || "");
    const companyId = requireCompanyId(body.companyId);
    if (!companyId) {
      return Response.json({ error: "Missing companyId — record without tenant is rejected" }, { status: 400 });
    }

    const sessionAuth = await authPowerCareSession(base44, companyId, body.sessionToken);
    if (!sessionAuth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const auth = {
      companyId,
      userId: sessionAuth.userId || null,
      name: sessionAuth.name || "User",
      role: sessionAuth.role || "employee",
      stationId: sessionAuth.stationId || null,
      owner: !!sessionAuth.owner || sessionAuth.role === "owner" || sessionAuth.admin,
      admin: !!sessionAuth.admin,
    };

    const managerRoles = ["owner", "director", "ops_manager", "station_manager", "pgm", "admin"];
    const isManager = auth.owner || auth.admin || managerRoles.includes(auth.role);

    const loadBlob = async (category: string) => {
      const rows = await base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId: auth.companyId, category });
      return rows[0] || null;
    };
    const saveTasks = async (tasks: unknown[]) => {
      const blob = await loadBlob(TASKS_CATEGORY);
      if (blob) {
        await base44.asServiceRole.entities.CompanyDataBlob.update(blob.id, { payload: tasks });
      } else {
        await base44.asServiceRole.entities.CompanyDataBlob.create({
          companyId: auth.companyId,
          category: TASKS_CATEGORY,
          payload: tasks,
        });
      }
    };
    const listTasksRaw = async () => {
      const blob = await loadBlob(TASKS_CATEGORY);
      const payload = Array.isArray(blob?.payload) ? blob.payload : [];
      // Strict: drop any row missing companyId or with a foreign tenant.
      return payload.filter((t) => t && t.companyId === auth.companyId);
    };

    const scopeFilter = (tasks: any[], scope: string | null | undefined) => {
      if (!scope || scope === "all") return tasks;
      return tasks.filter((t) => t.stationId === scope);
    };

    const loadPeople = async (stationId?: string | null) => {
      const emps = await base44.asServiceRole.entities.Employee.filter({ companyId: auth.companyId });
      const compBlob = await loadBlob(COMPETENCY_CATEGORY);
      const extra = Array.isArray(compBlob?.payload) ? compBlob.payload : [];
      const byEmp: Record<string, unknown[]> = {};
      for (const row of extra) {
        if (!row || row.companyId !== auth.companyId || !row.employeeId) continue;
        (byEmp[row.employeeId] ||= []).push(row);
      }
      return emps
        .filter((e) => !stationId || e.stationId === stationId)
        .map((e) => ({
          employeeId: e.employeeId,
          name: e.name,
          stationId: e.stationId || null,
          certificates: [...(Array.isArray(e.certificates) ? e.certificates : []), ...(byEmp[e.employeeId] || [])],
        }));
    };

    const audit = async (actionKey: string, details: string, extra: Record<string, unknown> = {}) => {
      await base44.asServiceRole.entities.AuditLog.create({
        companyId: auth.companyId,
        action: actionKey,
        performedBy: auth.name,
        details,
        reason: extra.reason || null,
        oldValue: extra.oldValue || null,
        newValue: extra.newValue || null,
      });
    };

    const awardPoints = async (task: any, awardedBy: string) => {
      const points = taskPoints(task.priority, task.effortWeight);
      const recipients: string[] = [];
      if (task.assignMode === "one" && task.ownerId) recipients.push(task.ownerId);
      else if (task.assignMode === "some") recipients.push(...(task.memberIds || []));
      else {
        const crew = await loadPeople(task.stationId);
        recipients.push(...crew.map((p) => p.employeeId));
      }
      const unique = [...new Set(recipients.filter(Boolean))];
      for (const employeeId of unique) {
        await base44.asServiceRole.entities.PointsLedger.create({
          companyId: auth.companyId,
          employeeId,
          points,
          targetId: task.id,
          taskTitle: task.title,
          priority: task.priority,
          effortWeight: task.effortWeight,
          stationId: task.stationId || null,
          awardedBy,
          awardedAt: new Date().toISOString(),
          reason: `اعتماد إنجاز — ${task.ref}`,
          evidenceUrls: (task.proofFiles || []).map((f: any) => f.url).filter(Boolean),
        });
        const records = await base44.asServiceRole.entities.Employee.filter({ companyId: auth.companyId, employeeId });
        if (records[0]) {
          await base44.asServiceRole.entities.Employee.update(records[0].id, {
            points: (Number(records[0].points) || 0) + points,
          });
        }
      }
      return { points, recipientIds: unique };
    };

    // ── seed competency lapse for testing (manager only) ─────────────────────
    if (action === "setCompetency") {
      if (!isManager) return Response.json({ error: "Forbidden" }, { status: 403 });
      const { employeeId, code, expiryDate, status } = body;
      if (!employeeId || !code) return Response.json({ error: "employeeId and code required" }, { status: 400 });
      const people = await base44.asServiceRole.entities.Employee.filter({ companyId: auth.companyId, employeeId });
      if (!people[0]) return Response.json({ error: "Employee not found in company" }, { status: 404 });
      const blob = await loadBlob(COMPETENCY_CATEGORY);
      const payload = Array.isArray(blob?.payload) ? [...blob.payload] : [];
      const entry = {
        companyId: auth.companyId,
        employeeId,
        code: String(code),
        expiryDate: expiryDate || "2020-01-01",
        status: status || "expired",
        name: String(code),
      };
      const idx = payload.findIndex((r) => r.employeeId === employeeId && r.code === entry.code);
      if (idx >= 0) payload[idx] = entry;
      else payload.push(entry);
      if (blob) await base44.asServiceRole.entities.CompanyDataBlob.update(blob.id, { payload });
      else await base44.asServiceRole.entities.CompanyDataBlob.create({ companyId: auth.companyId, category: COMPETENCY_CATEGORY, payload });
      return Response.json({ ok: true, entry });
    }

    if (action === "list" || action === "counts") {
      const scope = body.scope || body.stationId || null;
      const tasks = scopeFilter(await listTasksRaw(), scope);
      const counts = deriveOpsCounts(tasks);
      if (action === "counts") return Response.json({ counts });
      return Response.json({ tasks, counts });
    }

    if (action === "create") {
      if (!isManager) return Response.json({ error: "Forbidden: only managers can create tasks" }, { status: 403 });
      const title = String(body.title || "").trim();
      const priority = ["high", "medium", "low"].includes(body.priority) ? body.priority : "medium";
      const workKind = ["pm", "cm", "em", "pr", "cp"].includes(body.workKind) ? body.workKind : "pm";
      const assignMode = (["one", "some", "all"].includes(body.assignMode) ? body.assignMode : "one") as AssignMode;
      const stationId = body.stationId || null;
      const ownerId = body.ownerId || null;
      const memberIds = Array.isArray(body.memberIds) ? body.memberIds.map(String) : [];
      const effortWeight = clampEffortWeight(body.effortWeight);
      const targetCount = Math.max(1, Number(body.targetCount) || 1);
      const dueAt = body.dueAt ? String(body.dueAt).slice(0, 10) : null;
      const planPinned = body.planPinned === true;
      const planHorizon = planPinned && body.planHorizon
        ? String(body.planHorizon)
        : planHorizonFromDue(dueAt);
      const mode = body.mode === "remote" ? "remote" : "onsite";
      const steps = String(body.steps || "").split("\n").map((s: string) => s.trim()).filter(Boolean);

      if (!title) return Response.json({ error: "Title required" }, { status: 400 });
      if (assignMode === "one" && !ownerId) return Response.json({ error: "Owner required" }, { status: 400 });
      if (assignMode === "some" && !memberIds.length) return Response.json({ error: "Select at least one member" }, { status: 400 });
      if (assignMode === "all" && !stationId) return Response.json({ error: "Station required for whole-crew assignment" }, { status: 400 });

      const stationPeople = await loadPeople(assignMode === "all" || assignMode === "some" ? stationId : null);
      const allPeople = assignMode === "one" ? await loadPeople(null) : stationPeople;
      const gate = checkAssignGate({
        workKind,
        assignMode,
        ownerId,
        memberIds,
        stationId,
        people: assignMode === "all" ? stationPeople : allPeople,
        lang: body.lang === "en" ? "en" : "ar",
      });
      if (!gate.ok) {
        return Response.json({ error: "ASSIGN_GATE", reason: gate.reason, cert: gate.required, blocked: gate.blocked.map((p) => p.employeeId) }, { status: 403 });
      }

      const existing = await listTasksRaw();
      const seq = 4800 + existing.length + 1;
      const task = {
        id: crypto.randomUUID(),
        companyId: auth.companyId,
        ref: `OPS-${seq}`,
        title,
        stationId,
        priority,
        effortWeight,
        dueAt,
        planHorizon,
        planPinned,
        workKind,
        mode,
        assignMode,
        ownerId: assignMode === "one" ? ownerId : null,
        memberIds: assignMode === "some" ? memberIds : [],
        targetCount,
        completedCount: 0,
        status: "active",
        steps,
        proofFiles: [],
        attestation: "",
        pointsAwarded: null,
        approvedAt: null,
        approvedBy: null,
        createdAt: new Date().toISOString(),
        createdBy: auth.userId,
      };
      await saveTasks([task, ...existing]);
      await audit("ops_task_create", `Created ${task.ref}: ${task.title}`, { newValue: task.ref });
      const tasks = scopeFilter(await listTasksRaw(), body.scope || null);
      return Response.json({ task, counts: deriveOpsCounts(tasks) });
    }

    if (action === "logCompletion") {
      const taskId = body.taskId;
      const amount = Math.max(1, Number(body.amount) || 1);
      const attestation = String(body.attestation || "").trim();
      const proofFiles = Array.isArray(body.proofFiles)
        ? body.proofFiles.filter((f: any) => f && f.url).map((f: any) => ({ url: f.url, name: f.name || "file" }))
        : [];
      const tasks = await listTasksRaw();
      const idx = tasks.findIndex((t) => t.id === taskId);
      if (idx < 0) return Response.json({ error: "Task not found" }, { status: 404 });
      const task = { ...tasks[idx] };
      if (task.status === "completed") return Response.json({ error: "Already completed" }, { status: 400 });
      if (!proofFiles.length && !attestation) {
        return Response.json({ error: "PROOF_REQUIRED", reason: "لا نقطة بلا أثر — أرفق صورة أو اكتب إفادة أولًا" }, { status: 400 });
      }
      const next = Math.min(task.targetCount, (Number(task.completedCount) || 0) + amount);
      task.completedCount = next;
      task.proofFiles = [...(task.proofFiles || []), ...proofFiles];
      if (attestation) task.attestation = attestation;
      if (next >= task.targetCount) task.status = "awaiting_approval";
      else task.status = "active";
      tasks[idx] = task;
      await saveTasks(tasks);
      await audit("ops_task_log", `Logged ${next}/${task.targetCount} on ${task.ref}`);
      return Response.json({ task, counts: deriveOpsCounts(scopeFilter(tasks, body.scope || null)) });
    }

    if (action === "approve") {
      if (!isManager) return Response.json({ error: "Forbidden" }, { status: 403 });
      const tasks = await listTasksRaw();
      const idx = tasks.findIndex((t) => t.id === body.taskId);
      if (idx < 0) return Response.json({ error: "Task not found" }, { status: 404 });
      const task = { ...tasks[idx] };
      if (task.status !== "awaiting_approval" && (Number(task.completedCount) || 0) < (Number(task.targetCount) || 1)) {
        return Response.json({ error: "Not ready for approval" }, { status: 400 });
      }
      if (task.approvedAt) return Response.json({ error: "Already approved" }, { status: 400 });
      const awarded = await awardPoints(task, auth.userId || "manager");
      task.status = "completed";
      task.approvedAt = new Date().toISOString();
      task.approvedBy = auth.userId;
      task.pointsAwarded = awarded.points;
      tasks[idx] = task;
      await saveTasks(tasks);
      await audit("ops_task_approve", `Approved ${task.ref} — granted ${awarded.points} points`, { newValue: String(awarded.points) });
      return Response.json({ task, awarded, counts: deriveOpsCounts(scopeFilter(tasks, body.scope || null)) });
    }

    if (action === "reject") {
      if (!isManager) return Response.json({ error: "Forbidden" }, { status: 403 });
      const reason = String(body.reason || "").trim();
      if (!reason) return Response.json({ error: "Rejection reason required" }, { status: 400 });
      const tasks = await listTasksRaw();
      const idx = tasks.findIndex((t) => t.id === body.taskId);
      if (idx < 0) return Response.json({ error: "Task not found" }, { status: 404 });
      const task = { ...tasks[idx] };
      task.status = "active";
      task.completedCount = Math.max(0, (Number(task.targetCount) || 1) - 1);
      task.rejectReason = reason;
      tasks[idx] = task;
      await saveTasks(tasks);
      await audit("ops_task_reject", `Rejected ${task.ref}`, { reason });
      return Response.json({ task, counts: deriveOpsCounts(scopeFilter(tasks, body.scope || null)) });
    }

    if (action === "checkGate") {
      const workKind = body.workKind || "pm";
      const assignMode = (body.assignMode || "one") as AssignMode;
      const stationId = body.stationId || null;
      const people = await loadPeople(assignMode === "all" ? stationId : null);
      const gate = checkAssignGate({
        workKind,
        assignMode,
        ownerId: body.ownerId,
        memberIds: body.memberIds || [],
        stationId,
        people: assignMode === "one" ? await loadPeople(null) : people,
        lang: body.lang === "en" ? "en" : "ar",
      });
      return Response.json({ gate });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("operations error:", error);
    return Response.json({ error: error?.message || "Server error" }, { status: 500 });
  }
});
