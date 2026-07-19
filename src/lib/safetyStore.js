import { getCompanyData, logAudit, updateCompany } from "@/lib/store";

const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
const stationExists = (data, stationId) => (data?.stations || []).some((station) => station.id === stationId);
const dayKey = (value) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
const normalize = (value) => String(value || "").trim().toLocaleLowerCase().replace(/\s+/g, " ");

export function updateSafetyRecord(companyId, stationId, updates) {
  updateCompany(companyId, (data) => {
    if (!stationExists(data, stationId)) return;
    data.safety = data.safety || [];
    let rec = data.safety.find((item) => item.stationId === stationId);
    if (!rec) {
      rec = { id: uid("safe"), stationId, hazards: [], level: null, riskItems: [], workHoursMonthly: 0, ltiCount: 0, checklistResults: {}, permits: [], disabledTabs: [], createdAt: new Date().toISOString() };
      data.safety.push(rec);
    }
    const next = { ...updates };
    if (next.riskItems && !Array.isArray(next.riskItems)) delete next.riskItems;
    if (next.permits && !Array.isArray(next.permits)) delete next.permits;
    if (next.disabledTabs) next.disabledTabs = Array.isArray(next.disabledTabs) ? [...new Set(next.disabledTabs.filter((key) => ["risks", "kpis", "checklist", "permits"].includes(key)))] : [];
    if (next.checklistResults && typeof next.checklistResults !== "object") delete next.checklistResults;
    if ("workHoursMonthly" in next) next.workHoursMonthly = Math.max(0, Number(next.workHoursMonthly) || 0);
    if ("ltiCount" in next) next.ltiCount = Math.max(0, Math.floor(Number(next.ltiCount) || 0));
    if (next.lastInspection && new Date(next.lastInspection) > new Date()) delete next.lastInspection;
    if (next.level && !["green", "amber", "red"].includes(next.level)) delete next.level;
    Object.assign(rec, next);
    if ("level" in next || "lastInspection" in next || "hazards" in next) {
      rec.approvedBy = null;
      rec.approvedAt = null;
    }
    const inspectionEnd = rec.lastInspection ? new Date(rec.lastInspection).setHours(23, 59, 59, 999) : 0;
    const incidentUnreviewed = rec.lastIncidentAt && inspectionEnd < new Date(rec.lastIncidentAt).getTime();
    if (rec.level === "green" && ((rec.hazards || []).length || incidentUnreviewed)) rec.level = "amber";
  });
}

export function closeSafetyHazard(companyId, stationId, hazardIndex, closedBy) {
  updateCompany(companyId, (data) => {
    const rec = (data.safety || []).find((item) => item.stationId === stationId);
    if (!rec || hazardIndex < 0 || hazardIndex >= (rec.hazards || []).length) return;
    const [description] = rec.hazards.splice(hazardIndex, 1);
    rec.hazardLog = rec.hazardLog || [];
    rec.hazardLog.unshift({ id: uid("haz"), description, closedBy, closedAt: new Date().toISOString() });
    rec.approvedBy = null;
    rec.approvedAt = null;
  });
}

export function approveSafetyRecord(companyId, stationId, approvedBy) {
  let approved = false;
  updateCompany(companyId, (data) => {
    if (!stationExists(data, stationId)) return;
    data.safety = data.safety || [];
    let rec = data.safety.find((item) => item.stationId === stationId);
    if (!rec) {
      rec = { id: uid("safe"), stationId, hazards: [], level: null, riskItems: [], workHoursMonthly: 0, ltiCount: 0, checklistResults: {}, permits: [], disabledTabs: [], createdAt: new Date().toISOString() };
      data.safety.push(rec);
    }
    const at = new Date().toISOString();
    rec.approvedBy = approvedBy;
    rec.approvedAt = at;
    rec.incidentClearedAt = at;
    rec.approvalLog = [{ by: approvedBy, at }, ...(rec.approvalLog || [])];
    rec.incidentLog = (rec.incidentLog || []).map((incident) => incident.status === "closed" ? incident : { ...incident, status: "closed", reviewedBy: approvedBy, reviewedAt: at });
    rec.approvalSnapshot = {
      level: rec.level,
      lastInspection: rec.lastInspection,
      hazards: [...(rec.hazards || [])],
      incidentCount: (rec.incidentLog || []).length,
      checklistResults: JSON.parse(JSON.stringify(rec.checklistResults || {})),
      approvedAt: at,
    };
    approved = true;
  });
  return approved;
}

export function revokeSafetyApproval(companyId, stationId, revokedBy) {
  let revoked = false;
  updateCompany(companyId, (data) => {
    const rec = (data.safety || []).find((item) => item.stationId === stationId);
    const approvedAt = new Date(rec?.approvedAt).getTime();
    const elapsed = Date.now() - approvedAt;
    if (!rec?.approvedBy || !Number.isFinite(approvedAt) || elapsed < 0 || elapsed > 24 * 60 * 60 * 1000) return;
    rec.approvalRevocationLog = [{ by: revokedBy, at: new Date().toISOString(), approvalAt: rec.approvedAt }, ...(rec.approvalRevocationLog || [])];
    rec.approvedBy = null;
    rec.approvedAt = null;
    rec.approvalSnapshot = null;
    revoked = true;
  });
  return revoked;
}

export function recordSafetyIncident(companyId, stationId, description, actorName = "") {
  const text = String(description || "").trim();
  const data = getCompanyData(companyId);
  if (!text || !stationExists(data, stationId)) return false;
  const existing = (data.safety || []).find((item) => item.stationId === stationId);
  if ((existing?.incidentLog || []).some((item) => dayKey(item.at) === dayKey(new Date()) && normalize(item.description) === normalize(text))) return false;
  const stationName = data.stations.find((station) => station.id === stationId)?.name || stationId;
  logAudit(companyId, "safety_incident_logged", `Safety incident logged at station "${stationName}" — ${text}.`);
  updateCompany(companyId, (current) => {
    current.safety = current.safety || [];
    let rec = current.safety.find((item) => item.stationId === stationId);
    if (!rec) {
      rec = { id: uid("safe"), stationId, hazards: [], level: null, riskItems: [], workHoursMonthly: 0, ltiCount: 0, checklistResults: {}, permits: [], disabledTabs: [], createdAt: new Date().toISOString() };
      current.safety.push(rec);
    }
    rec.lastIncidentAt = new Date().toISOString();
    rec.incidentLog = rec.incidentLog || [];
    rec.incidentLog.unshift({ id: uid("inc"), description: text, at: rec.lastIncidentAt, by: actorName, status: "open" });
    rec.incidents = rec.incidentLog.length;
    if (rec.level !== "red") rec.level = "amber";
    rec.approvedBy = null;
    rec.approvedAt = null;
  });
  return true;
}