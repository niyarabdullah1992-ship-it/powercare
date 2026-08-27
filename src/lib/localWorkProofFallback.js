import {
  checkAcceptGate,
  checkApproveWorkProofGate,
  checkEditWorkProofGate,
  checkEndWorkProofGate,
  deriveProofCounts,
  deriveProofStage,
} from "@/lib/workProofDerivations";
import { updateCompany } from "@/lib/store";

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function withStage(proof) {
  return { ...proof, stage: deriveProofStage(proof) };
}

// Proof cycle bridge: once a work proof is sealed it must enter the signing
// stage — the same way the daily report issues a signature request — so the
// trust ledger and the dashboard signing metric reflect it. Idempotent per proof.
function linkSealedProofToSigning(companyId, proof) {
  if (!proof || proof.status !== "sealed") return;
  updateCompany(companyId, (data) => {
    data.signatureRequests = Array.isArray(data.signatureRequests) ? data.signatureRequests : [];
    if (data.signatureRequests.some((request) => request && request.recordId === proof.id)) return;
    data.signatureRequests.unshift({
      id: uid("sg"),
      status: "pending",
      title: `شهادة إنجاز — ${proof.title || proof.ref || "إثبات عمل"}`,
      source: "workproof",
      createdAt: new Date().toISOString(),
      stationId: proof.stationId || null,
      recordId: proof.id,
      sealId: proof.sealId || null,
    });
    if (proof.raiserId) {
      data.notifications = Array.isArray(data.notifications) ? data.notifications : [];
      data.notifications.unshift({
        id: uid("ntf"),
        userId: proof.raiserId,
        text: `🔏 خُتم إثبات العمل "${proof.title || proof.ref}" وأُدرج في التوقيع الرقمي.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  });
}

export function listLocalWorkProofs(data) {
  const proofs = (Array.isArray(data?.workProofs) ? data.workProofs : []).map(withStage);
  return { proofs, counts: deriveProofCounts(proofs), source: "local" };
}

export function raiseLocalWorkProof(companyId, input, actor = {}) {
  const title = String(input.title || "").trim();
  const workReason = String(input.workReason || "").trim();
  const entityName = String(input.entityName || input.client || "").trim();
  const client = String(input.client || entityName).trim();
  const stationId = String(input.stationId || "").trim();
  const beforeStamp = String(input.beforeStamp || "").trim();
  if (!title || !workReason || !entityName || !stationId || !beforeStamp) {
    return { ok: false, error: "Missing title, workReason, entityName, stationId, or beforeStamp" };
  }
  const geoVerdict = String(input.geoVerdict || "in").toLowerCase().startsWith("out") ? "out" : "in";
  const proof = {
    id: uid("wp"),
    companyId,
    ref: `WP-${Date.now().toString().slice(-6)}`,
    title,
    workReason,
    entityKind: String(input.entityKind || "company").trim(),
    entityName,
    entityUnified: String(input.entityUnified || "").trim(),
    entityCr: String(input.entityCr || "").trim(),
    entityQiwa: String(input.entityQiwa || "").trim(),
    entitySite: String(input.entitySite || "").trim(),
    entityProject: String(input.entityProject || "").trim(),
    entityContact: String(input.entityContact || "").trim(),
    entityPhone: String(input.entityPhone || "").trim(),
    entityEmail: String(input.entityEmail || "").trim(),
    personName: String(input.personName || "").trim(),
    personId: String(input.personId || "").trim(),
    personTitle: String(input.personTitle || "").trim(),
    personPhone: String(input.personPhone || "").trim(),
    startedAt: input.startedAt || new Date().toISOString(),
    endedAt: null,
    vehicle: input.vehicle && typeof input.vehicle === "object" ? input.vehicle : {},
    client,
    stationId,
    techId: actor.id || null,
    raiserId: actor.id || null,
    beforeStamp,
    afterStamp: null,
    beforeUrl: input.beforeUrl || null,
    afterUrl: null,
    geoVerdict,
    geoCleared: false,
    status: "await",
    endedById: null,
    endedBy: null,
    createdAt: new Date().toISOString(),
  };
  updateCompany(companyId, (data) => {
    data.workProofs = [proof, ...(Array.isArray(data.workProofs) ? data.workProofs : [])];
  });
  return { ok: true, proof: withStage(proof) };
}

export function endLocalWorkProof(companyId, proof, actor, extra = {}) {
  const gate = checkEndWorkProofGate({
    proof,
    actorUserId: actor?.id,
    sameBranch: !!extra.sameBranch,
    isManager: !!extra.isManager,
  });
  if (!gate.ok) return { error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn };
  const afterStamp = String(extra.afterStamp || "").trim();
  const afterUrl = extra.afterUrl || null;
  if (!afterStamp || !afterUrl) {
    return { error: "AFTER_PHOTO_REQUIRED", reason: "ارفع صورة البعد لإنهاء العمل." };
  }
  let next = null;
  updateCompany(companyId, (data) => {
    const list = Array.isArray(data.workProofs) ? data.workProofs : [];
    const idx = list.findIndex((item) => item.id === proof.id || item.ref === proof.ref);
    if (idx < 0) return;
    next = {
      ...list[idx],
      endedAt: extra.endedAt || new Date().toISOString(),
      afterStamp,
      afterUrl,
      endedById: actor?.id || null,
      endedBy: actor?.name || null,
      status: "ready",
      sealId: null,
      approvedAt: null,
    };
    const approve = checkApproveWorkProofGate({
      proof: next,
      actorUserId: actor?.id,
      geoClearReason: extra.geoClearReason || "إنهاء العمل بصورة البعد",
    });
    if (approve.ok) {
      next = {
        ...next,
        geoCleared: next.geoVerdict === "out" ? true : next.geoCleared,
        geoClearReason: extra.geoClearReason || next.geoClearReason || "إنهاء العمل بصورة البعد",
        approvedBy: actor?.name || null,
        approvedAt: new Date().toISOString(),
        sealId: approve.sealId,
        status: "sealed",
      };
    }
    list[idx] = next;
    data.workProofs = list;
  });
  if (!next) return { error: "PROOF_NOT_FOUND", reason: "الإثبات غير موجود." };
  linkSealedProofToSigning(companyId, next);
  return { ok: true, proof: withStage(next) };
}

export function editLocalWorkProof(companyId, proof, actor, input = {}) {
  const gate = checkEditWorkProofGate({
    proof,
    actorUserId: actor?.id,
    sameBranch: !!input.sameBranch,
    isManager: !!input.isManager,
  });
  if (!gate.ok) return { error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn };
  const title = String(input.title || "").trim();
  const workReason = String(input.workReason || "").trim();
  const entityName = String(input.entityName || input.client || "").trim();
  if (!title || !workReason || !entityName) {
    return { error: "MISSING_FIELDS", reason: "الوصف وسبب العمل واسم المستفيد مطلوبة." };
  }
  let next = null;
  updateCompany(companyId, (data) => {
    const list = Array.isArray(data.workProofs) ? data.workProofs : [];
    const idx = list.findIndex((item) => item.id === proof.id || item.ref === proof.ref);
    if (idx < 0) return;
    next = {
      ...list[idx],
      title,
      workReason,
      entityKind: String(input.entityKind || list[idx].entityKind || "company").trim(),
      entityName,
      entityUnified: String(input.entityUnified ?? list[idx].entityUnified ?? "").trim(),
      entityCr: String(input.entityCr ?? list[idx].entityCr ?? "").trim(),
      entityQiwa: String(input.entityQiwa ?? list[idx].entityQiwa ?? "").trim(),
      entitySite: String(input.entitySite ?? list[idx].entitySite ?? "").trim(),
      entityProject: String(input.entityProject ?? list[idx].entityProject ?? "").trim(),
      entityContact: String(input.entityContact ?? list[idx].entityContact ?? "").trim(),
      entityPhone: String(input.entityPhone ?? list[idx].entityPhone ?? "").trim(),
      entityEmail: String(input.entityEmail ?? list[idx].entityEmail ?? "").trim(),
      personName: String(input.personName ?? list[idx].personName ?? "").trim(),
      personId: String(input.personId ?? list[idx].personId ?? "").trim(),
      personTitle: String(input.personTitle ?? list[idx].personTitle ?? "").trim(),
      personPhone: String(input.personPhone ?? list[idx].personPhone ?? "").trim(),
      startedAt: input.startedAt || list[idx].startedAt,
      vehicle: input.vehicle && typeof input.vehicle === "object" ? input.vehicle : list[idx].vehicle,
      client: String(input.client || input.entityContact || entityName).trim(),
      stationId: String(input.stationId || list[idx].stationId || "").trim(),
      geoVerdict: String(input.geoVerdict || list[idx].geoVerdict || "in").toLowerCase().startsWith("out") ? "out" : "in",
      editedAt: new Date().toISOString(),
      editedBy: actor?.name || null,
      editedById: actor?.id || null,
    };
    list[idx] = next;
    data.workProofs = list;
  });
  if (!next) return { error: "PROOF_NOT_FOUND", reason: "الإثبات غير موجود." };
  return { ok: true, proof: withStage(next) };
}

export function approveLocalWorkProof(companyId, proof, actor, geoClearReason) {
  const gate = checkApproveWorkProofGate({
    proof,
    actorUserId: actor?.id,
    geoClearReason,
  });
  if (!gate.ok) return { error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn };
  let next = null;
  updateCompany(companyId, (data) => {
    const list = Array.isArray(data.workProofs) ? data.workProofs : [];
    const idx = list.findIndex((item) => item.id === proof.id || item.ref === proof.ref);
    if (idx < 0) return;
    next = {
      ...list[idx],
      geoCleared: list[idx].geoVerdict === "out" ? true : list[idx].geoCleared,
      geoClearReason: geoClearReason || list[idx].geoClearReason || null,
      approvedBy: actor?.name || "Supervisor",
      approvedAt: new Date().toISOString(),
      sealId: gate.sealId,
      status: "sealed",
    };
    list[idx] = next;
    data.workProofs = list;
  });
  if (!next) return { error: "PROOF_NOT_FOUND", reason: "الإثبات غير موجود." };
  linkSealedProofToSigning(companyId, next);
  return { ok: true, proof: withStage(next) };
}

export function acceptLocalWorkProof(companyId, proof) {
  const gate = checkAcceptGate(proof);
  if (!gate.ok) return { error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn };
  let next = null;
  updateCompany(companyId, (data) => {
    const list = Array.isArray(data.workProofs) ? data.workProofs : [];
    const idx = list.findIndex((item) => item.id === proof.id || item.ref === proof.ref);
    if (idx < 0) return;
    next = {
      ...list[idx],
      acceptedAt: new Date().toISOString(),
      status: "accepted",
      sealId: gate.sealId,
    };
    list[idx] = next;
    data.workProofs = list;
  });
  if (!next) return { error: "PROOF_NOT_FOUND", reason: "الإثبات غير موجود." };
  return { ok: true, proof: withStage(next) };
}

export function rejectLocalWorkProof(companyId, proof, actor, reason) {
  if (actor?.id && proof.raiserId && String(actor.id) === String(proof.raiserId)) {
    return { error: "SELF_APPROVE_FORBIDDEN", reason: "من رفع الإثبات لا يرفضه كمعتمد." };
  }
  let next = null;
  updateCompany(companyId, (data) => {
    const list = Array.isArray(data.workProofs) ? data.workProofs : [];
    const idx = list.findIndex((item) => item.id === proof.id || item.ref === proof.ref);
    if (idx < 0) return;
    next = { ...list[idx], status: "rejected", rejectReason: reason || null, sealId: null, approvedAt: null };
    list[idx] = next;
    data.workProofs = list;
  });
  if (!next) return { error: "PROOF_NOT_FOUND", reason: "الإثبات غير موجود." };
  return { ok: true, proof: withStage(next) };
}
