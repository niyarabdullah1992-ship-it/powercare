/** Work Proof chain — capture → supervisor approve → seal → client accept.
 *  Design: NiroVera Platform.dc.html (workproof / seal / selfBlock / geoBlock).
 */

export type GeoVerdict = "in" | "out";

export type WorkProofLike = {
  id?: string;
  ref: string;
  title?: string;
  client?: string;
  stationId?: string;
  techId?: string | null;
  raiserId?: string | null;
  beforeStamp?: string | null;
  afterStamp?: string | null;
  geoVerdict?: GeoVerdict | string | null;
  geoCleared?: boolean;
  geoClearReason?: string | null;
  status?: string | null; // await | ready | sealed | accepted | rejected
  approvedBy?: string | null;
  approvedAt?: string | null;
  acceptedAt?: string | null;
  sealId?: string | null;
};

function fnv1a(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Seal covers ref + both stamps + location verdict — altering any invalidates it. */
export function sealIdFor(proof: {
  ref: string;
  beforeStamp?: string | null;
  afterStamp?: string | null;
  geoVerdict?: string | null;
}) {
  const geo: GeoVerdict = String(proof.geoVerdict || "in").toLowerCase().startsWith("out") ? "out" : "in";
  const src = `${proof.ref}|${proof.beforeStamp || ""}|${proof.afterStamp || ""}|${geo}`;
  const h = fnv1a(src);
  const tail = (h % 1679616).toString(36).toUpperCase().padStart(4, "0");
  const refDigits = String(proof.ref || "").replace(/\D/g, "").slice(-4) || "0000";
  return `NV-WP-${refDigits}-${tail}`;
}

export function hasAfterCapture(proof: WorkProofLike) {
  const after = String(proof.afterStamp || "").trim();
  return !!after && after !== "—";
}

export function isOutsideGeofence(proof: WorkProofLike) {
  const v = String(proof.geoVerdict || "in").toLowerCase();
  return v === "out" || v.includes("outside") || v.includes("خارج");
}

/** Derive stage from record fields — never a free-form literal alone. */
export function deriveProofStage(proof: WorkProofLike): "await" | "ready" | "sealed" | "accepted" | "rejected" {
  if (proof.status === "rejected") return "rejected";
  if (proof.status === "accepted" || proof.acceptedAt) return "accepted";
  if (proof.status === "sealed" || proof.sealId || proof.approvedAt) return "sealed";
  if (!hasAfterCapture(proof)) return "await";
  return "ready";
}

export function deriveProofCounts(proofs: WorkProofLike[]) {
  const list = Array.isArray(proofs) ? proofs : [];
  const counts = { total: list.length, await: 0, ready: 0, sealed: 0, accepted: 0, rejected: 0 };
  for (const p of list) {
    const st = deriveProofStage(p);
    counts[st] += 1;
  }
  return counts;
}

/** Supervisor approve → seal. Named gates only. */
export function checkApproveWorkProofGate(input: {
  proof: WorkProofLike | null | undefined;
  actorUserId?: string | null;
  geoClearReason?: string | null;
}) {
  const proof = input.proof;
  if (!proof) {
    return { ok: false as const, error: "PROOF_NOT_FOUND", reason: "الإثبات غير موجود في نطاق الشركة.", reasonEn: "Proof not found in this company." };
  }
  const stage = deriveProofStage(proof);
  if (stage === "rejected") {
    return { ok: false as const, error: "PROOF_REJECTED", reason: "الإثبات مرفوض — يلزم إعادة التصوير.", reasonEn: "Proof was rejected — re-capture is required." };
  }
  if (stage !== "ready") {
    return {
      ok: false as const,
      error: stage === "await" ? "AFTER_PHOTO_REQUIRED" : "NOT_AWAITING_APPROVAL",
      reason: stage === "await" ? "لا اعتماد قبل صورة البعد المختومة." : "الإثبات ليس بانتظار اعتماد المشرف.",
      reasonEn: stage === "await" ? "Cannot approve before the stamped after photo." : "Proof is not awaiting supervisor approval.",
    };
  }
  if (input.actorUserId && proof.raiserId && String(input.actorUserId) === String(proof.raiserId)) {
    return {
      ok: false as const,
      error: "SELF_APPROVE_FORBIDDEN",
      reason: "من رفع الإثبات لا يعتمده — الالتقاط والاعتماد فعلان منفصلان.",
      reasonEn: "The raiser cannot approve their own proof — capture and approval are separate acts.",
    };
  }
  if (isOutsideGeofence(proof) && !proof.geoCleared) {
    const reason = String(input.geoClearReason || "").trim();
    if (!reason) {
      return {
        ok: false as const,
        error: "GEO_CLEARANCE_REQUIRED",
        reason: "التقاط خارج النطاق يوقف عند الاعتماد — اقبل بسبب مكتوب أو ارفض.",
        reasonEn: "Out-of-geofence capture stops at approval — accept with a written reason or reject.",
      };
    }
  }
  return { ok: true as const, sealId: sealIdFor(proof) };
}

export function checkAcceptGate(proof: WorkProofLike | null | undefined) {
  if (!proof) {
    return { ok: false as const, error: "PROOF_NOT_FOUND", reason: "الإثبات غير موجود.", reasonEn: "Proof not found." };
  }
  const stage = deriveProofStage(proof);
  if (stage !== "sealed") {
    return {
      ok: false as const,
      error: "NOT_SEALED",
      reason: "لا استلام من العميل قبل ختم المشرف.",
      reasonEn: "Client cannot accept before the supervisor seal.",
    };
  }
  const expected = sealIdFor(proof);
  if (proof.sealId && proof.sealId !== expected) {
    return {
      ok: false as const,
      error: "SEAL_INVALID",
      reason: "الختم باطل — تغيّر مرجع أو طوابع أو حكم الموقع.",
      reasonEn: "Seal is invalid — ref, stamps, or location verdict changed.",
    };
  }
  return { ok: true as const, sealId: expected };
}
