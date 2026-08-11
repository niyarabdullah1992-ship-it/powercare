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

export function checkApproveWorkProofGate({ proof, actorUserId, geoClearReason }) {
  if (!proof) return { ok: false, error: "PROOF_NOT_FOUND", reason: "الإثبات غير موجود في نطاق الشركة." };
  const stage = deriveProofStage(proof);
  if (stage === "rejected") return { ok: false, error: "PROOF_REJECTED", reason: "الإثبات مرفوض — يلزم إعادة التصوير." };
  if (stage !== "ready") {
    return {
      ok: false,
      error: stage === "await" ? "AFTER_PHOTO_REQUIRED" : "NOT_AWAITING_APPROVAL",
      reason: stage === "await" ? "لا اعتماد قبل صورة البعد المختومة." : "الإثبات ليس بانتظار اعتماد المشرف.",
    };
  }
  if (actorUserId && proof.raiserId && String(actorUserId) === String(proof.raiserId)) {
    return {
      ok: false,
      error: "SELF_APPROVE_FORBIDDEN",
      reason: "من رفع الإثبات لا يعتمده — الالتقاط والاعتماد فعلان منفصلان.",
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
