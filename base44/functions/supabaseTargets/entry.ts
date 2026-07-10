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
        // PGM sees only managed stations; station_manager sees only their station
        if (body.userRole === "pgm") {
          const managed = new Set(body.managedStations || []);
          const filtered = (rows || []).filter((tg) => {
            const key = tg.assignment_type === "station_team" ? (tg.assignment_id || tg.station_id)
              : tg.assignment_type === "hq_team" ? "hq"
              : (tg.station_id || tg.employee_id);
            return managed.has(key);
          });
          return Response.json({ targets: filtered });
        }
        if (body.userRole === "station_manager") {
          const myStation = body.stationId;
          const filtered = (rows || []).filter((tg) => {
            if (tg.assignment_type === "station_team") return tg.assignment_id === myStation;
            if (tg.assignment_type === "member") return tg.station_id === myStation;
            return false;
          });
          return Response.json({ targets: filtered });
        }
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
      const { managerId, taskTarget, days, title, description, steps, fileUrl, fileUrls, assignmentType, assignmentId, employeeId, stationId, priority, startDate: customStart, endDate: customEnd, section, taskType } = body;
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
          steps: steps || null,
          file_url: (Array.isArray(fileUrls) && fileUrls[0]?.url) ? fileUrls[0].url : (fileUrl || null),
          file_urls: Array.isArray(fileUrls) && fileUrls.length ? fileUrls : null,
          employee_id: aType === "member" ? employeeId : (assignmentId || managerId),
          assignment_type: aType,
          assignment_id: assignmentId || null,
          station_id: stationId || null,
          section: section || null,
          task_type: taskType || null,
          manager_id: managerId,
          task_target: Number(taskTarget),
          days: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000),
          completed_tasks: 0,
          start_date: startDate,
          end_date: endDate,
          priority: priority || "medium",
          status: "active",
        }),
      });
      const created = await res.json();
      if (!res.ok) {
        return Response.json({ error: created?.message || "Failed to create target — run: ALTER TABLE targets ADD COLUMN IF NOT EXISTS section text; ALTER TABLE targets ADD COLUMN IF NOT EXISTS task_type text;" }, { status: 400 });
      }
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

    if (action === "updateTarget") {
      if (!isManager) {
        return Response.json({ error: "Forbidden: only managers can edit targets" }, { status: 403 });
      }
      const { targetId, title, description, steps, priority, endDate, taskTarget, section, taskType, reason } = body;
      if (!targetId) return Response.json({ error: "Missing targetId" }, { status: 400 });
      const patch: Record<string, unknown> = {};
      if (title !== undefined) patch.title = title;
      if (description !== undefined) patch.description = description;
      if (steps !== undefined) patch.steps = steps;
      if (priority !== undefined) patch.priority = priority;
      if (endDate !== undefined) patch.end_date = endDate;
      if (taskTarget !== undefined) patch.task_target = Number(taskTarget);
      if (section !== undefined) patch.section = section;
      if (taskType !== undefined) patch.task_type = taskType;
      if (reason !== undefined) patch.reason = reason;
      const res = await fetch(`${SUPABASE_URL}/rest/v1/targets?id=eq.${encodeURIComponent(targetId)}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      if (!res.ok) {
        return Response.json({ error: updated?.message || "Failed to update target — run: ALTER TABLE targets ADD COLUMN IF NOT EXISTS reason text;" }, { status: 400 });
      }
      return Response.json({ target: Array.isArray(updated) ? updated[0] : updated });
    }

    if (action === "setReason") {
      const { targetId, reason } = body;
      if (!targetId) return Response.json({ error: "Missing targetId" }, { status: 400 });
      const getRes = await fetch(`${SUPABASE_URL}/rest/v1/targets?id=eq.${encodeURIComponent(targetId)}`, { headers });
      const rows = await getRes.json();
      const tg = rows[0];
      if (!tg) return Response.json({ error: "Target not found" }, { status: 404 });
      const today = new Date().toISOString().slice(0, 10);
      const log = Array.isArray(tg.reason_log) ? tg.reason_log.filter((e) => e.date !== today) : [];
      if (reason) log.push({ date: today, reason });
      log.sort((a, b) => (a.date < b.date ? 1 : -1));
      const res = await fetch(`${SUPABASE_URL}/rest/v1/targets?id=eq.${encodeURIComponent(targetId)}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ reason: reason || null, reason_log: log }),
      });
      const updated = await res.json();
      if (!res.ok) {
        return Response.json({ error: updated?.message || "Failed to save reason — run: ALTER TABLE targets ADD COLUMN IF NOT EXISTS reason text; ALTER TABLE targets ADD COLUMN IF NOT EXISTS reason_log jsonb DEFAULT '[]'::jsonb;" }, { status: 400 });
      }
      return Response.json({ target: Array.isArray(updated) ? updated[0] : updated });
    }

    if (action === "listNotifications") {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${encodeURIComponent(body.userId)}&order=created_at.desc&limit=20`,
        { headers }
      );
      const rows = await res.json();
      return Response.json({ notifications: rows });
    }

    if (action === "addComment") {
      const { targetId, userId, userName, content, files } = body;
      if (!targetId || (!content && (!files || files.length === 0))) {
        return Response.json({ error: "Missing fields" }, { status: 400 });
      }
      const getRes = await fetch(
        `${SUPABASE_URL}/rest/v1/targets?id=eq.${encodeURIComponent(targetId)}`,
        { headers }
      );
      const rows = await getRes.json();
      const tg = rows[0];
      if (!tg) return Response.json({ error: "Target not found" }, { status: 404 });
      const comments = Array.isArray(tg.comments) ? tg.comments : [];
      const cleanFiles = Array.isArray(files)
        ? files
            .filter((f) => f && f.url)
            .map((f) => ({ url: f.url, name: f.name || "file", type: f.type || "file" }))
        : [];
      const newComment = {
        id: crypto.randomUUID(),
        user_id: userId,
        user_name: userName || "User",
        content: content || "",
        files: cleanFiles,
        created_at: new Date().toISOString(),
      };
      comments.push(newComment);
      const patchRes = await fetch(
        `${SUPABASE_URL}/rest/v1/targets?id=eq.${encodeURIComponent(targetId)}`,
        {
          method: "PATCH",
          headers: { ...headers, Prefer: "return=representation" },
          body: JSON.stringify({ comments }),
        }
      );
      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        return Response.json({ error: patchData?.message || "Failed to save comment — run: ALTER TABLE targets ADD COLUMN IF NOT EXISTS comments jsonb DEFAULT '[]'::jsonb;" }, { status: 400 });
      }
      return Response.json({ comment: newComment, comments });
    }

    if (action === "listFolders") {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/task_folders?order=sort_order.asc,path.asc`, { headers });
      const rows = await res.json();
      if (!res.ok) return Response.json({ folders: [] });
      return Response.json({ folders: rows || [] });
    }

    if (action === "createFolder") {
      const { stationId, path, sortOrder } = body;
      if (!stationId || !path) return Response.json({ error: "Missing fields" }, { status: 400 });
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/task_folders?station_id=eq.${encodeURIComponent(stationId)}&path=eq.${encodeURIComponent(path)}`,
        { headers }
      );
      const existing = await checkRes.json();
      if (Array.isArray(existing) && existing.length > 0) {
        return Response.json({ folder: existing[0] });
      }
      const res = await fetch(`${SUPABASE_URL}/rest/v1/task_folders`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ station_id: stationId, path, sort_order: Number(sortOrder) || 0 }),
      });
      const created = await res.json();
      if (!res.ok) {
        return Response.json({ error: created?.message || "Failed to create section — run: CREATE TABLE IF NOT EXISTS task_folders (id uuid primary key default gen_random_uuid(), station_id text, path text, sort_order integer default 0, created_at timestamptz default now());" }, { status: 400 });
      }
      return Response.json({ folder: Array.isArray(created) ? created[0] : created });
    }

    if (action === "reorderFolders") {
      const { items } = body;
      if (!Array.isArray(items) || items.length === 0) return Response.json({ error: "Missing items" }, { status: 400 });
      await Promise.all(
        items.filter((it) => it && it.id).map((it) =>
          fetch(`${SUPABASE_URL}/rest/v1/task_folders?id=eq.${encodeURIComponent(it.id)}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ sort_order: Number(it.sortOrder) || 0 }),
          })
        )
      );
      return Response.json({ ok: true });
    }

    if (action === "renameFolder") {
      const { stationId, oldPath, newPath } = body;
      if (!stationId || !oldPath || !newPath) return Response.json({ error: "Missing fields" }, { status: 400 });
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/task_folders?station_id=eq.${encodeURIComponent(stationId)}&or=(path.eq.${encodeURIComponent(oldPath)},path.like.${encodeURIComponent(oldPath)}/*)`,
        { headers }
      );
      const rows = await res.json();
      for (const row of rows || []) {
        const updatedPath = row.path === oldPath ? newPath : newPath + row.path.slice(oldPath.length);
        await fetch(`${SUPABASE_URL}/rest/v1/task_folders?id=eq.${encodeURIComponent(row.id)}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ path: updatedPath }),
        });
      }
      return Response.json({ ok: true });
    }

    if (action === "deleteFolder") {
      const { stationId, path } = body;
      if (!stationId || !path) return Response.json({ error: "Missing fields" }, { status: 400 });
      await fetch(
        `${SUPABASE_URL}/rest/v1/task_folders?station_id=eq.${encodeURIComponent(stationId)}&or=(path.eq.${encodeURIComponent(path)},path.like.${encodeURIComponent(path)}/*)`,
        { method: "DELETE", headers }
      );
      return Response.json({ ok: true });
    }

    if (action === "listChatMessages") {
      const { stationId } = body;
      if (!stationId) return Response.json({ error: "Missing stationId" }, { status: 400 });
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/station_chat?station_id=eq.${encodeURIComponent(stationId)}&order=created_at.asc&limit=200`,
        { headers }
      );
      const rows = await res.json();
      if (!res.ok) return Response.json({ messages: [] });
      return Response.json({ messages: rows || [] });
    }

    if (action === "sendChatMessage") {
      const { stationId, userId, userName, text, files } = body;
      if (!stationId || !userId || (!text && (!files || files.length === 0))) {
        return Response.json({ error: "Missing fields" }, { status: 400 });
      }
      const cleanFiles = Array.isArray(files)
        ? files.filter((f) => f && f.url).map((f) => ({ url: f.url, name: f.name || "file", type: f.type || "file" }))
        : [];
      const res = await fetch(`${SUPABASE_URL}/rest/v1/station_chat`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          station_id: stationId,
          user_id: userId,
          user_name: userName || "User",
          text: text || "",
          files: cleanFiles,
        }),
      });
      const created = await res.json();
      if (!res.ok) {
        return Response.json({ error: created?.message || "Failed to send message — run: CREATE TABLE IF NOT EXISTS station_chat (id uuid primary key default gen_random_uuid(), station_id text, user_id text, user_name text, text text, files jsonb DEFAULT '[]'::jsonb, created_at timestamptz default now());" }, { status: 400 });
      }
      return Response.json({ message: Array.isArray(created) ? created[0] : created });
    }

    if (action === "listDirectMessages") {
      const { userId, otherUserId } = body;
      if (!userId || !otherUserId) return Response.json({ error: "Missing fields" }, { status: 400 });
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/direct_messages?or=(and(sender_id.eq.${encodeURIComponent(userId)},receiver_id.eq.${encodeURIComponent(otherUserId)}),and(sender_id.eq.${encodeURIComponent(otherUserId)},receiver_id.eq.${encodeURIComponent(userId)}))&order=created_at.asc&limit=200`,
        { headers }
      );
      const rows = await res.json();
      if (!res.ok) return Response.json({ messages: [] });
      return Response.json({ messages: rows || [] });
    }

    if (action === "sendDirectMessage") {
      const { senderId, senderName, receiverId, text, files } = body;
      if (!senderId || !receiverId || (!text && (!files || files.length === 0))) {
        return Response.json({ error: "Missing fields" }, { status: 400 });
      }
      const cleanFiles = Array.isArray(files)
        ? files.filter((f) => f && f.url).map((f) => ({ url: f.url, name: f.name || "file", type: f.type || "file" }))
        : [];
      const res = await fetch(`${SUPABASE_URL}/rest/v1/direct_messages`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          sender_id: senderId,
          sender_name: senderName || "User",
          receiver_id: receiverId,
          text: text || "",
          files: cleanFiles,
        }),
      });
      const created = await res.json();
      if (!res.ok) {
        return Response.json({ error: created?.message || "Failed to send message — run: CREATE TABLE IF NOT EXISTS direct_messages (id uuid primary key default gen_random_uuid(), sender_id text, sender_name text, receiver_id text, text text, files jsonb DEFAULT '[]'::jsonb, created_at timestamptz default now());" }, { status: 400 });
      }
      return Response.json({ message: Array.isArray(created) ? created[0] : created });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});