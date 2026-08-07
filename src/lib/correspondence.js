// المعاملات والمراسلات: وارد/صادر برقم نظامي ومهلة وسلسلة إحالات.
import { updateCompany, logAudit } from "@/lib/store";

export const DIRECTIONS = ["incoming", "outgoing", "internal"];
export const STATUSES = ["open", "referred", "closed"];

export const directionLabel = (direction, ar) =>
  direction === "outgoing" ? (ar ? "صادر" : "Outgoing")
  : direction === "internal" ? (ar ? "داخلي" : "Internal")
  : (ar ? "وارد" : "Incoming");

export const statusLabel = (status, ar) =>
  ({ open: ar ? "مفتوحة" : "Open", referred: ar ? "محالة" : "Referred", closed: ar ? "مغلقة" : "Closed" })[status] || status;

export function nextNumber(list, direction) {
  const year = new Date().getFullYear();
  const prefix = direction === "outgoing" ? "OUT" : direction === "internal" ? "INT" : "IN";
  const count = list.filter((item) => item.direction === direction && String(item.number || "").includes(`-${year}-`)).length;
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
}

// المهلة النظامية: متجاوزة، أو قريبة من التجاوز خلال يومين.
export function slaState(record) {
  if (record.status === "closed" || !record.dueDate) return "none";
  const remainingMs = new Date(record.dueDate).getTime() - Date.now();
  if (remainingMs < 0) return "breached";
  if (remainingMs <= 2 * 86400000) return "atRisk";
  return "onTime";
}

export function createCorrespondence(companyId, payload, actor) {
  const id = `corr_${Math.random().toString(36).slice(2, 9)}`;
  updateCompany(companyId, (data) => {
    data.correspondence = data.correspondence || [];
    data.correspondence.unshift({
      id,
      number: payload.number || nextNumber(data.correspondence, payload.direction),
      direction: payload.direction,
      subject: payload.subject,
      counterparty: payload.counterparty || "",
      summary: payload.summary || "",
      dueDate: payload.dueDate || null,
      status: "open",
      ownerId: payload.ownerId || actor?.id || null,
      referrals: [],
      decision: null,
      createdBy: actor?.name || "",
      createdAt: new Date().toISOString(),
    });
  });
  logAudit(companyId, "correspondence_created", `Correspondence ${payload.subject} created.`);
  return id;
}

export function referCorrespondence(companyId, id, { toEmployeeId, toName, note, dueDate }, actor) {
  updateCompany(companyId, (data) => {
    const record = (data.correspondence || []).find((item) => item.id === id);
    if (!record) return;
    record.referrals.push({ at: new Date().toISOString(), byName: actor?.name || "", toEmployeeId, toName, note: note || "" });
    record.ownerId = toEmployeeId || record.ownerId;
    if (dueDate) record.dueDate = dueDate;
    record.status = "referred";
  });
  logAudit(companyId, "correspondence_referred", `Correspondence ${id} referred to ${toName}.`);
}

// ختم القرار: يُغلق المعاملة ويُسجَّل باسم صاحب القرار ووقته.
export function closeCorrespondence(companyId, id, decision, actor) {
  updateCompany(companyId, (data) => {
    const record = (data.correspondence || []).find((item) => item.id === id);
    if (!record) return;
    record.decision = { text: decision, byName: actor?.name || "", byId: actor?.id || null, at: new Date().toISOString() };
    record.status = "closed";
  });
  logAudit(companyId, "correspondence_closed", `Correspondence ${id} closed with a signed decision.`);
}