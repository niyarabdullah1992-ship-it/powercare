/** Client mirror of base44/shared/workProofDerivations.ts */

function fnv1a(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function sealIdFor(proof) {
  const geo = String(proof.geoVerdict || "in").toLowerCase().startsWith("out") ? "out" : "in";
  const src = `${proof.ref}|${proof.beforeStamp || ""}|${proof.afterStamp || ""}|${geo}`;
  const h = fnv1a(src);
  const tail = (h % 1679616).toString(36).toUpperCase().padStart(4, "0");
  const refDigits = String(proof.ref || "").replace(/\D/g, "").slice(-4) || "0000";
  return `NV-WP-${refDigits}-${tail}`;
}

export function hasAfterCapture(proof) {
  const after = String(proof.afterStamp || "").trim();
  return !!after && after !== "—";
}

export function isOutsideGeofence(proof) {
  const v = String(proof.geoVerdict || "in").toLowerCase();
  return v === "out" || v.includes("outside") || v.includes("خارج");
}

export function deriveProofStage(proof) {
  if (proof.status === "rejected") return "rejected";
  if (proof.status === "accepted" || proof.acceptedAt) return "accepted";
  if (proof.status === "sealed" || proof.sealId || proof.approvedAt) return "sealed";
  if (!hasAfterCapture(proof)) return "await";
  return "ready";
}

export function deriveProofCounts(proofs = []) {
  const counts = { total: proofs.length, await: 0, ready: 0, sealed: 0, accepted: 0, rejected: 0 };
  for (const p of proofs) counts[deriveProofStage(p)] += 1;
  return counts;
}

export function isSameProofBranch(actorStationId, proofStationId) {
  return !!(actorStationId && proofStationId && String(actorStationId) === String(proofStationId));
}

export function checkEndWorkProofGate({ proof, actorUserId, sameBranch, isManager }) {
  if (!proof) return { ok: false, error: "PROOF_NOT_FOUND", reason: "الإثبات غير موجود.", reasonEn: "Proof not found." };
  if (deriveProofStage(proof) !== "await") {
    return { ok: false, error: "NOT_IN_PROGRESS", reason: "هذا الإثبات ليس بانتظار الإنهاء.", reasonEn: "This proof is not waiting to be ended." };
  }
  const isRaiser = actorUserId && proof.raiserId && String(actorUserId) === String(proof.raiserId);
  if (!isRaiser && !sameBranch && !isManager) {
    return {
      ok: false,
      error: "BRANCH_REQUIRED",
      reason: "إنهاء العمل لمن رفعه أو لموظف في نفس الفرع.",
      reasonEn: "Only the raiser or another employee at the same branch can end the work.",
    };
  }
  return { ok: true, autoApprove: true };
}

/** Ending with an after photo is the approval act — always seal. */
export function shouldSealOnEnd() {
  return true;
}

export const WORK_PROOF_EDIT_MS = 24 * 60 * 60 * 1000;

export function proofEditDeadline(proof) {
  const created = new Date(proof?.createdAt || 0).getTime();
  if (!Number.isFinite(created) || created <= 0) return null;
  return created + WORK_PROOF_EDIT_MS;
}

export function checkEditWorkProofGate({ proof, actorUserId, sameBranch, isManager, now = Date.now() }) {
  if (!proof) return { ok: false, error: "PROOF_NOT_FOUND", reason: "الإثبات غير موجود.", reasonEn: "Proof not found." };
  const stage = deriveProofStage(proof);
  if (stage === "sealed" || stage === "accepted" || stage === "rejected") {
    return {
      ok: false,
      error: "LOCKED_AFTER_SEAL",
      reason: "بعد الختم أو الرفض لا يُعدَّل الإثبات.",
      reasonEn: "A sealed, accepted, or rejected proof cannot be edited.",
    };
  }
  const deadline = proofEditDeadline(proof);
  if (!deadline || now > deadline) {
    return {
      ok: false,
      error: "EDIT_WINDOW_CLOSED",
      reason: "انتهت مهلة التعديل — يوم واحد من الرفع.",
      reasonEn: "The one-day edit window from raise time has closed.",
    };
  }
  const isRaiser = actorUserId && proof.raiserId && String(actorUserId) === String(proof.raiserId);
  if (!isRaiser && !sameBranch && !isManager) {
    return {
      ok: false,
      error: "BRANCH_REQUIRED",
      reason: "التعديل لمن رفعه أو لموظف في نفس الفرع.",
      reasonEn: "Only the raiser or another employee at the same branch can edit.",
    };
  }
  return { ok: true, until: new Date(deadline).toISOString() };
}

export function checkApproveWorkProofGate({ proof, actorUserId, geoClearReason }) {
  if (!proof) return { ok: false, error: "PROOF_NOT_FOUND", reason: "الإثبات غير موجود في نطاق الشركة." };
  const stage = deriveProofStage(proof);
  if (stage === "rejected") return { ok: false, error: "PROOF_REJECTED", reason: "الإثبات مرفوض — يلزم إعادة التصوير." };
  if (stage !== "ready") {
    return {
      ok: false,
      error: stage === "await" ? "AFTER_PHOTO_REQUIRED" : "NOT_AWAITING_APPROVAL",
      reason: stage === "await" ? "لا اعتماد قبل إنهاء العمل وصورة البعد." : "الإثبات ليس بانتظار اعتماد الإنهاء.",
    };
  }
  const alreadyEnded = hasAfterCapture(proof) && (proof.endedAt || proof.endedById);
  if (actorUserId && proof.raiserId && String(actorUserId) === String(proof.raiserId) && !alreadyEnded) {
    return {
      ok: false,
      error: "SELF_APPROVE_FORBIDDEN",
      reason: "من رفع الإثبات لا يعتمده قبل إنهائه بصورة البعد.",
    };
  }
  if (isOutsideGeofence(proof) && !proof.geoCleared && !String(geoClearReason || "").trim()) {
    return {
      ok: false,
      error: "GEO_CLEARANCE_REQUIRED",
      reason: "التقاط خارج النطاق يوقف عند الاعتماد — اقبل بسبب مكتوب أو ارفض.",
    };
  }
  return { ok: true, sealId: sealIdFor(proof) };
}

export function checkAcceptGate(proof) {
  if (!proof) return { ok: false, error: "PROOF_NOT_FOUND", reason: "الإثبات غير موجود." };
  if (deriveProofStage(proof) !== "sealed") {
    return { ok: false, error: "NOT_SEALED", reason: "لا استلام من العميل قبل ختم المشرف." };
  }
  const expected = sealIdFor(proof);
  if (proof.sealId && proof.sealId !== expected) {
    return { ok: false, error: "SEAL_INVALID", reason: "الختم باطل — تغيّر مرجع أو طوابع أو حكم الموقع." };
  }
  return { ok: true, sealId: expected };
}
