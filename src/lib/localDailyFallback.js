/**
 * Local daily-report board when dailyReport cloud function is down.
 * Derives one row per station from company store — same fact links as server.
 */
import {
  buildShortDailyNote,
  checkIssueSignedDailyGate,
  DEFAULT_SHIFT_END,
  deriveDailyRowStatus,
  deriveDailySummary,
  deriveStationFacts,
} from "@/lib/dailyReportDerivations";
import { deriveProofStage } from "@/lib/workProofDerivations";
import { updateCompany, getCompanyData, addNotification, addCompanyFile } from "@/lib/store";
import { isLocalPreviewActive } from "@/lib/localPreview";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hmNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isDailyRow(r) {
  return r && (r.kind === "daily" || r.type === "daily" || r.category === "daily" || !r.kind);
}

function managerRoles() {
  return ["owner", "director", "ops_manager", "station_manager", "pgm", "admin"];
}

function countUnexcusedAbsences(data, stationId, dayKey) {
  const emps = (data?.employees || []).filter((e) => String(e.stationId) === String(stationId));
  if (!emps.length) return 0;
  const attendance = (data?.personalAttendance || []).filter((r) => String(r.date) === dayKey);
  let n = 0;
  for (const e of emps) {
    if (e.attendanceStatus === "absent") {
      n += 1;
      continue;
    }
    const row = attendance.find((r) => String(r.employeeId) === String(e.id));
    if (row && (row.status === "absent" || (!row.checkInAt && row.status === "absent"))) n += 1;
  }
  return n;
}

function countProofsApproved(data, stationId) {
  const proofs = (data?.workProofs || []).filter((p) => String(p.stationId) === String(stationId));
  if (proofs.length) {
    return proofs.filter((p) => {
      const stage = deriveProofStage(p);
      return stage === "sealed" || stage === "accepted";
    }).length;
  }
  const sealedDocs = (data?.signedDocuments || []).filter((d) =>
    String(d.stationId) === String(stationId) && (d.status === "signed" || d.sealId),
  ).length;
  return sealedDocs;
}

export function buildLocalDailyBoard(data, { shiftEnd = DEFAULT_SHIFT_END } = {}) {
  const stations = data?.stations || [];
  const tasks = data?.tasks || [];
  const safety = data?.safety || [];
  const dayKey = todayKey();
  const filed = (data?.reports || []).filter(isDailyRow);
  const byStation = new Map();
  for (const r of filed) {
    if (r.dateKey && r.dateKey !== dayKey) continue;
    if (r.stationId) byStation.set(String(r.stationId), r);
  }

  const shiftEnded = hmNow() > shiftEnd;
  const rows = stations.map((st) => {
    const report = byStation.get(String(st.id)) || {
      stationId: st.id,
      filedAt: null,
      approved: false,
      note: null,
      filedBy: null,
    };
    const tasksClosed = tasks.filter((t) =>
      String(t.stationId) === String(st.id)
      && (t.status === "completed" || t.approvedAt),
    ).length;
    const openHazards = (safety.find((s) => String(s.stationId) === String(st.id))?.hazards || []).length;
    const facts = deriveStationFacts({
      tasksClosed,
      openHazards,
      unexcusedAbsences: countUnexcusedAbsences(data, st.id, dayKey),
      proofsApproved: countProofsApproved(data, st.id),
    });
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
      dateKey: dayKey,
    };
  });

  return {
    rows,
    summary: deriveDailySummary(rows),
    source: "local",
    dateKey: dayKey,
    shiftEnd,
  };
}

export function fileLocalDaily(companyId, stationId, { name, note, facts, ar = true } = {}) {
  const dayKey = todayKey();
  const hm = hmNow();
  const shiftEnd = DEFAULT_SHIFT_END;
  updateCompany(companyId, (d) => {
    const list = Array.isArray(d.reports) ? d.reports : [];
    const idx = list.findIndex((r) =>
      String(r.stationId) === String(stationId)
      && (r.dateKey === dayKey || !r.dateKey)
      && isDailyRow(r),
    );
    const short = String(note || "").trim().slice(0, 160)
      || (hm > shiftEnd
        ? (ar ? "رُفع من الفرع بعد نهاية الوردية" : "Filed after shift end")
        : buildShortDailyNote(facts || [], ar));
    const row = {
      id: idx >= 0 ? list[idx].id : `dr_${stationId}_${dayKey}`,
      kind: "daily",
      stationId,
      dateKey: dayKey,
      filedAt: hm,
      filedBy: name || "—",
      note: short,
      approved: false,
      approvedAt: null,
      approvedBy: null,
      returnedAt: null,
      returnReason: null,
      isLateAtFile: hm > shiftEnd,
      status: "pending",
      createdAt: idx >= 0 ? list[idx].createdAt : new Date().toISOString(),
    };
    if (idx >= 0) list[idx] = { ...list[idx], ...row };
    else list.push(row);
    d.reports = list;
  });
  return buildLocalDailyBoard(getCompanyData(companyId));
}

export function approveLocalDaily(companyId, stationId, { name } = {}) {
  const dayKey = todayKey();
  updateCompany(companyId, (d) => {
    const list = Array.isArray(d.reports) ? d.reports : [];
    d.reports = list.map((r) => {
      if (String(r.stationId) !== String(stationId)) return r;
      if (r.dateKey && r.dateKey !== dayKey) return r;
      if (!isDailyRow(r)) return r;
      const isLate = !!(r.isLateAtFile || r.isLate || (r.filedAt && r.filedAt > DEFAULT_SHIFT_END));
      return {
        ...r,
        approved: true,
        approvedAt: new Date().toISOString(),
        approvedBy: name || "—",
        isLate,
        status: "approved",
      };
    });
  });
  return buildLocalDailyBoard(getCompanyData(companyId));
}

export function returnLocalDaily(companyId, stationId, { reason, name } = {}) {
  const dayKey = todayKey();
  let authorId = null;
  updateCompany(companyId, (d) => {
    const list = Array.isArray(d.reports) ? d.reports : [];
    d.reports = list.map((r) => {
      if (String(r.stationId) !== String(stationId)) return r;
      if (r.dateKey && r.dateKey !== dayKey) return r;
      if (!isDailyRow(r)) return r;
      const author = (d.employees || []).find((e) => e.name === r.filedBy);
      if (author) authorId = author.id;
      const prevLate = !!(r.isLate || r.isLateAtFile || (r.filedAt && r.filedAt > DEFAULT_SHIFT_END));
      return {
        ...r,
        approved: false,
        approvedAt: null,
        approvedBy: null,
        returnedAt: new Date().toISOString(),
        returnedBy: name || "—",
        returnReason: reason || "يلزم تصحيح",
        isLate: prevLate,
        status: "review",
        // Keep filedAt — return un-approves; it does not erase the filing.
      };
    });
  });
  if (authorId) {
    addNotification(
      companyId,
      authorId,
      reason
        ? `أُعيد تقريرك اليومي للتصحيح: ${reason}`
        : "أُعيد تقريرك اليومي للتصحيح — راجع الملاحظات.",
    );
  }
  return buildLocalDailyBoard(getCompanyData(companyId));
}

export function chaseLocalDaily(companyId, { stationIds } = {}) {
  const data = getCompanyData(companyId);
  const board = buildLocalDailyBoard(data);
  const missing = board.rows.filter((r) => {
    if (!r.missing) return false;
    if (Array.isArray(stationIds) && stationIds.length) {
      return stationIds.map(String).includes(String(r.stationId));
    }
    return true;
  });
  const names = missing.map((r) => r.stationName);
  const roles = managerRoles();
  for (const row of missing) {
    const managers = (data?.employees || []).filter((e) =>
      String(e.stationId) === String(row.stationId) && roles.includes(e.role),
    );
    const text = `التقرير اليومي مستحق منذ نهاية الوردية — ${row.stationName}`;
    if (managers.length) {
      for (const m of managers) addNotification(companyId, m.id, text);
    } else if (data?.ownerId) {
      addNotification(companyId, data.ownerId, text);
    }
  }
  return { names, count: names.length, board: buildLocalDailyBoard(getCompanyData(companyId)) };
}

export function issueSignedLocalDaily(companyId, { name, stationIds } = {}) {
  const data = getCompanyData(companyId);
  const board = buildLocalDailyBoard(data);
  const dayKey = board.dateKey || todayKey();
  const scopeRows = Array.isArray(stationIds) && stationIds.length
    ? board.rows.filter((r) => stationIds.map(String).includes(String(r.stationId)))
    : board.rows;
  const alreadyIssued = (data?.dailySignedRecords || []).some((r) => r && r.dateKey === dayKey);
  const gate = checkIssueSignedDailyGate({ rows: scopeRows, alreadyIssued });
  if (!gate.ok) return { error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn, board };

  const record = {
    id: uid("drsig"),
    dateKey: dayKey,
    issuedAt: new Date().toISOString(),
    issuedBy: name || "—",
    summary: board.summary,
    rows: scopeRows.map((r) => ({
      stationId: r.stationId,
      stationName: r.stationName,
      filedAt: r.filedAt,
      approved: r.approved,
      isLate: r.isLate,
      facts: r.facts,
    })),
  };

  updateCompany(companyId, (d) => {
    d.dailySignedRecords = Array.isArray(d.dailySignedRecords) ? d.dailySignedRecords : [];
    d.dailySignedRecords.unshift(record);
    d.signatureRequests = Array.isArray(d.signatureRequests) ? d.signatureRequests : [];
    d.signatureRequests.unshift({
      id: uid("sg"),
      status: "pending",
      title: `حصيلة يومية موقّعة — ${dayKey}`,
      source: "daily_report",
      createdAt: new Date().toISOString(),
      stationId: null,
      recordId: record.id,
    });
  });

  addCompanyFile(companyId, {
    name: `حصيلة يومية موقّعة — ${dayKey}.pdf`,
    parentId: null,
    url: `#local-daily-signed-${record.id}`,
    size: 0,
    mimeType: "application/pdf",
    uploadedBy: name || "—",
    stationId: null,
  });

  return { record, board: buildLocalDailyBoard(getCompanyData(companyId)) };
}

export function shouldUseLocalDaily() {
  return isLocalPreviewActive();
}
