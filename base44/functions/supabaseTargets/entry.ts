import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const MANAGER_ROLES = ["director", "ops_manager", "pgm", "station_manager"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "").replace(/\/rest\/v\d+$/, "");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { action } = body;

    const headers = {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    };

    // Permission helper: managers can create; employees see only their own.
    const isManager = MANAGER_ROLES.includes(body.userRole);

    if (action === "listTargets") {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/targets?order=created_at.desc`, { headers });
      const rows = await res.json();
      // Overdue detection: auto-close targets past their end date
      const now = Date.now();
      for (const tg of rows || []) {
        if (tg.status === "active" && new Date(tg.end_date).getTime() < now) {
          // notify manager
          await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              user_id: tg.manager_id,
              message: `Target "${tg.title || "Untitled"}" is OVERDUED — time expired before reaching the goal (${tg.completed_tasks}/${tg.task_target}).`,
            }),
          });
          // notify assigned employee (member only)
          if (tg.assignment_type === "member" && tg.employee_id) {
            await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                user_id: tg.employee_id,
                message: `Your target "${tg.title || "Untitled"}" is OVERDUED — time expired (${tg.completed_tasks}/${tg.task_target}).`,
              }),
            });
          }
          // mark overdue in DB
          await fetch(`${SUPABASE_URL}/rest/v1/targets?id=eq.${encodeURIComponent(tg.id)}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status: "overdue" }),
          });
          tg.status = "overdue";
        }
      }
      if (isManager) {
        return Response.json({ targets: rows });
      }
      // Employee: filter by assignment type
      const myStation = body.stationId || null;
      const filtered = (rows || []).filter((tg) => {
        if (tg.assignment_type === "member") return tg.employee_id === body.userId;
        if (tg.assignment_type === "station_team") return tg.assignment_id === myStation;
        if (tg.assignment_type === "hq_team") return !myStation;
        // legacy rows without assignment_type
        return tg.employee_id === body.userId;
      });
      return Response.json({ targets: filtered });
    }

    if (action === "createTarget") {
      if (!isManager) {
        return Response.json({ error: "Forbidden: only managers can create targets" }, { status: 403 });
      }
      const { managerId, taskTarget, days, title, description, assignmentType, assignmentId, employeeId, stationId, startDate: customStart, endDate: customEnd } = body;
      if (!taskTarget) {
        return Response.json({ error: "Missing task target" }, { status: 400 });
      }
      const hasCustomRange = customStart && customEnd;
      const hasDays = Number(days) > 0;
      if (!hasCustomRange && !hasDays) {
        return Response.json({ error: "Missing duration or date range" }, { status: 400 });
      }
      const aType = assignmentType || "member";
      if (aType === "member" && !employeeId) {
        return Response.json({ error: "Select an employee for member assignment" }, { status: 400 });
      }
      if (aType === "station_team" && !assignmentId) {
        return Response.json({ error: "Select a station for team assignment" }, { status: 400 });
      }
      const startDate = customStart || new Date().toISOString();
      const endDate = customEnd || new Date(Date.now() + Number(days) * 86400000).toISOString();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/targets`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          title: title || null,
          description: description || null,
          employee_id: aType === "member" ? employeeId : null,
          assignment_type: aType,
          assignment_id: assignmentId || null,
          station_id: stationId || null,
          manager_id: managerId,
          task_target: Number(taskTarget),
          days: Number(days),
          completed_tasks: 0,
          start_date: startDate,
          end_date: endDate,
          status: "active",
        }),
      });
      const created = await res.json();
      // Notify the assigned employee (member only)
      if (aType === "member" && employeeId) {
        await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            user_id: employeeId,
            message: `New target assigned: ${title || taskTarget + " tasks"} — ${taskTarget} tasks in ${days} days.`,
          }),
        });
      }
      return Response.json({ target: Array.isArray(created) ? created[0] : created });
    }

    if (action === "updateProgress") {
      const { targetId, amount, managerId, employeeName } = body;
      if (!targetId || !amount) {
        return Response.json({ error: "Missing fields" }, { status: 400 });
      }
      // Fetch current target
      const getRes = await fetch(
        `${SUPABASE_URL}/rest/v1/targets?id=eq.${encodeURIComponent(targetId)}`,
        { headers }
      );
      const rows = await getRes.json();
      const tg = rows[0];
      if (!tg) return Response.json({ error: "Target not found" }, { status: 404 });
      const newCompleted = Math.min(tg.completed_tasks + Number(amount), tg.task_target);
      const status = newCompleted >= tg.task_target ? "completed" : "active";
      const patchRes = await fetch(
        `${SUPABASE_URL}/rest/v1/targets?id=eq.${encodeURIComponent(targetId)}`,
        {
          method: "PATCH",
          headers: { ...headers, Prefer: "return=representation" },
          body: JSON.stringify({ completed_tasks: newCompleted, status }),
        }
      );
      const updated = await patchRes.json();
      // Notify the manager
      await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: managerId || tg.manager_id,
          message: `${employeeName || "Employee"} completed ${amount} tasks (${newCompleted}/${tg.task_target}).`,
        }),
      });
      // On completion, notify the responsible employee (member) with a celebration
      if (status === "completed" && tg.assignment_type === "member" && tg.employee_id) {
        await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            user_id: tg.employee_id,
            message: `🎉 Target "${tg.title || "Untitled"}" COMPLETED! You reached the goal (${tg.task_target} tasks).`,
          }),
        });
      }
      return Response.json({ target: updated[0] });
    }

    if (action === "deleteTarget") {
      const { targetId } = body;
      if (!targetId) return Response.json({ error: "Missing targetId" }, { status: 400 });
      await fetch(`${SUPABASE_URL}/rest/v1/targets?id=eq.${encodeURIComponent(targetId)}`, {
        method: "DELETE",
        headers,
      });
      return Response.json({ ok: true });
    }

    if (action === "listNotifications") {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${encodeURIComponent(body.userId)}&order=created_at.desc&limit=20`,
        { headers }
      );
      const rows = await res.json();
      return Response.json({ notifications: rows });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});