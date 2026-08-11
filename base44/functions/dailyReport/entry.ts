import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";
import { authPowerCareSession } from "../../shared/powerCareSession.ts";
import {
  checkApproveDailyGate,
  DEFAULT_SHIFT_END,
  deriveDailyRowStatus,
  deriveDailySummary,
  deriveStationFacts,
  riyadhDateKey,
} from "../../shared/dailyReportDerivations.ts";
import { deriveProofStage } from "../../shared/workProofDerivations.ts";
import { isOnApprovedLeave } from "../../shared/leaveDerivations.ts";

const DAILY_CATEGORY = "dailyReports";
const TASKS_CATEGORY = "operationsTasks";
const SAFETY_CATEGORY = "safety";
const PROOFS_CATEGORY = "workProofs";

function requireCompanyId(companyId: unknown) {
  const id = typeof companyId === "string" ? companyId.trim() : "";
  if (!id) return null;
  return id;
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function hmNow() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
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
    const saveBlob = async (category: string, payload: unknown) => {
      const blob = await loadBlob(category);
      if (blob) await base44.asServiceRole.entities.CompanyDataBlob.update(blob.id, { payload });
      else await base44.asServiceRole.entities.CompanyDataBlob.create({ companyId: auth.companyId, category, payload });
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

    const dateKey = String(body.dateKey || riyadhDateKey());
    const shiftEnd = String(body.shiftEnd || DEFAULT_SHIFT_END);

    const loadDayReports = async () => {
      const blob = await loadBlob(DAILY_CATEGORY);
      const payload = Array.isArray(blob?.payload) ? blob.payload : [];
      return payload.filter((r: any) => r && r.companyId === auth.companyId && r.dateKey === dateKey);
    };

    const buildBoard = async () => {
      const stations = await base44.asServiceRole.entities.Station.filter({ companyId: auth.companyId });
      const emps = await base44.asServiceRole.entities.Employee.filter({ companyId: auth.companyId });
      const taskBlob = await loadBlob(TASKS_CATEGORY);
      const tasks = (Array.isArray(taskBlob?.payload) ? taskBlob.payload : []).filter((t: any) => t?.companyId === auth.companyId);
      const safetyBlob = await loadBlob(SAFETY_CATEGORY);
      const safety = Array.isArray(safetyBlob?.payload) ? safetyBlob.payload : [];
      const proofBlob = await loadBlob(PROOFS_CATEGORY);
      const proofs = (Array.isArray(proofBlob?.payload) ? proofBlob.payload : []).filter((p: any) => p?.companyId === auth.companyId);
      const dayReports = await loadDayReports();
      const byStation = new Map(dayReports.map((r: any) => [r.stationId, r]));

      const nowHm = hmNow();
      const shiftEnded = nowHm > shiftEnd;

      const rows = stations.map((st: any) => {
        const stationId = st.id;
        const report = byStation.get(stationId) || {
          stationId,
          companyId: auth.companyId,
          dateKey,
          filedAt: null,
          approved: false,
        };
        const tasksClosed = tasks.filter((t: any) =>
          t.stationId === stationId && (t.status === "completed" || t.approvedAt),
        ).length;
        const openHazards = (safety.find((s: any) => s.stationId === stationId)?.hazards || []).length;
        const proofsApproved = proofs.filter((p: any) => {
          if (p.stationId !== stationId) return false;
          const stage = deriveProofStage(p);
          return stage === "sealed" || stage === "accepted";
        }).length;
        const stationEmps = emps.filter((e: any) => e.stationId === stationId);
        // Unexcused absence proxy: employees not on approved leave and with no "present" flag for today —
        // without live attendance rows we count 0 rather than invent absences.
        let unexcusedAbsences = 0;
        for (const e of stationEmps) {
          if (isOnApprovedLeave(e.leaveRequests || [], dateKey)) continue;
        }
        // Prefer explicit absence markers on employee if present.
        unexcusedAbsences = stationEmps.filter((e: any) =>
          e.attendanceStatus === "absent" && !isOnApprovedLeave(e.leaveRequests || [], dateKey),
        ).length;

        const facts = deriveStationFacts({ tasksClosed, openHazards, unexcusedAbsences, proofsApproved });
        const derived = deriveDailyRowStatus(report, { shiftEnd, shiftEnded });
        return {
          ...derived,
          stationName: st.name,
          filedBy: report.filedBy || null,
          note: report.note || null,
          approvedBy: report.approvedBy || null,
          approvedAt: report.approvedAt || null,
          returnReason: report.returnReason || null,
          facts,
          dateKey,
        };
      });

      return { rows, summary: deriveDailySummary(rows), dateKey, shiftEnd };
    };

    if (action === "board" || action === "summary") {
      const board = await buildBoard();
      if (action === "summary") return Response.json({ summary: board.summary, dateKey, shiftEnd });
      return Response.json(board);
    }

    if (action === "file") {
      const stationId = String(body.stationId || auth.stationId || "").trim();
      if (!stationId) return Response.json({ error: "Missing stationId" }, { status: 400 });
      if (!isManager && auth.stationId && auth.stationId !== stationId) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      const reports = await loadDayReports();
      const idx = reports.findIndex((r: any) => r.stationId === stationId);
      const filedAt = String(body.filedAt || hmNow());
      const note = String(body.note || "").trim();
      const next = {
        id: idx >= 0 ? reports[idx].id : uid("dr"),
        companyId: auth.companyId,
        stationId,
        dateKey,
        filedAt,
        filedBy: auth.name,
        note: note || null,
        approved: false,
        approvedAt: null,
        approvedBy: null,
        returnedAt: null,
        returnReason: null,
        isLateAtFile: filedAt > shiftEnd,
      };
      if (idx >= 0) reports[idx] = { ...reports[idx], ...next, approved: false, approvedAt: null, approvedBy: null };
      else reports.push(next);
      await saveBlob(DAILY_CATEGORY, reports);
      await audit("daily_report_filed", `Daily report filed for ${stationId} at ${filedAt}`);
      return Response.json({ report: next, ok: true, isLate: next.isLateAtFile });
    }

    if (action === "approve" || action === "approveAll") {
      if (!isManager) return Response.json({ error: "Forbidden" }, { status: 403 });
      const reports = await loadDayReports();
      const ids = action === "approveAll"
        ? reports.filter((r: any) => r.filedAt && !r.approved).map((r: any) => r.stationId)
        : [String(body.stationId || "").trim()].filter(Boolean);
      if (!ids.length) return Response.json({ error: "Nothing to approve" }, { status: 400 });

      const approved: any[] = [];
      for (const stationId of ids) {
        const idx = reports.findIndex((r: any) => r.stationId === stationId);
        if (idx < 0) {
          if (action === "approve") return Response.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
          continue;
        }
        const gate = checkApproveDailyGate(reports[idx]);
        if (!gate.ok) {
          if (action === "approve") return Response.json({ error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn }, { status: 422 });
          continue;
        }
        // Preserve lateness: store isLate beside approval — never clear it.
        reports[idx] = {
          ...reports[idx],
          approved: true,
          approvedAt: new Date().toISOString(),
          approvedBy: auth.name,
          isLate: gate.isLate || !!reports[idx].isLateAtFile,
        };
        approved.push(reports[idx]);
      }
      await saveBlob(DAILY_CATEGORY, reports);
      await audit("daily_report_approved", `Approved ${approved.length} daily report(s)`);
      return Response.json({ ok: true, approved });
    }

    if (action === "return") {
      if (!isManager) return Response.json({ error: "Forbidden" }, { status: 403 });
      const stationId = String(body.stationId || "").trim();
      const reason = String(body.reason || "").trim();
      const reports = await loadDayReports();
      const idx = reports.findIndex((r: any) => r.stationId === stationId);
      if (idx < 0) return Response.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });
      const prevLate = reports[idx].isLate || reports[idx].isLateAtFile || (reports[idx].filedAt && reports[idx].filedAt > shiftEnd);
      reports[idx] = {
        ...reports[idx],
        approved: false,
        approvedAt: null,
        approvedBy: null,
        returnedAt: new Date().toISOString(),
        returnReason: reason || null,
        isLate: !!prevLate,
      };
      await saveBlob(DAILY_CATEGORY, reports);
      await audit("daily_report_returned", `Returned daily report ${stationId}`, { reason });
      return Response.json({ ok: true, report: reports[idx] });
    }

    if (action === "chase") {
      if (!isManager) return Response.json({ error: "Forbidden" }, { status: 403 });
      const board = await buildBoard();
      const missing = board.rows.filter((r) => r.missing).map((r) => r.stationName);
      await audit("daily_report_chased", `Chased outstanding daily reports: ${missing.join(", ") || "none"}`);
      return Response.json({ ok: true, chased: missing, count: missing.length });
    }

    if (action === "issueSigned") {
      if (!isManager) return Response.json({ error: "Forbidden" }, { status: 403 });
      const board = await buildBoard();
      const record = {
        id: uid("drsig"),
        companyId: auth.companyId,
        dateKey,
        issuedAt: new Date().toISOString(),
        issuedBy: auth.name,
        summary: board.summary,
        rows: board.rows.map((r) => ({
          stationId: r.stationId,
          stationName: r.stationName,
          filedAt: r.filedAt,
          approved: r.approved,
          isLate: r.isLate,
          facts: r.facts,
        })),
      };
      const blob = await loadBlob("dailySignedRecords");
      const payload = Array.isArray(blob?.payload) ? blob.payload : [];
      payload.unshift(record);
      await saveBlob("dailySignedRecords", payload);
      await audit("daily_report_signed_issued", `Issued signed daily record for ${dateKey}`);
      return Response.json({ ok: true, record });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("dailyReport error:", error);
    return Response.json({ error: String(error?.message || error) }, { status: 500 });
  }
});
