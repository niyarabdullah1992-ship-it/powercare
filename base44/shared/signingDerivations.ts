/** Digital signing — ordered chain, PENDING seals, FNV verification ids.
 *  Design: NiroVera Platform.dc.html (corpSeal / signing chain / linkedDocs).
 */

export const SIGNING_SOURCES = [
  "workproof",
  "payroll",
  "leave",
  "completion_cert",
] as const;

export type SigningSource = (typeof SIGNING_SOURCES)[number];

export type SignerLike = {
  sid: string;
  name: string;
  userId?: string | null;
  signedAt?: string | null;
  sealId?: string | null;
  fingerprint?: string | null;
};

export type SigningDocLike = {
  id?: string;
  docKey: string;
  title: string;
  source: SigningSource | string;
  sourceRef?: string | null;
  contentHash?: string | null; // invariant input — altering invalidates seals
  companyId?: string;
  signers: SignerLike[];
  sentAt?: string | null;
  createdAt?: string | null;
};

function fnv1a(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Hex groups derived from a seed — same algorithm as design `grp`. */
export function sealGroups(seed: string, n: number) {
  let h = fnv1a(seed);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    h = (Math.imul(h, 16777619) + 2166136261) >>> 0;
    out.push((h % 65536).toString(16).toUpperCase().padStart(4, "0"));
  }
  return out.join("-");
}

export function sealSeed(doc: { docKey: string; contentHash?: string | null }, signer: { sid: string }) {
  return `${doc.docKey}|${signer.sid}|${doc.contentHash || ""}`;
}

/** Verification id once signed; empty → PENDING presentation. */
export function sealIdFor(doc: { docKey: string; contentHash?: string | null }, signer: { sid: string }, signedAt?: string | null) {
  if (!signedAt) return "";
  const seed = `${sealSeed(doc, signer)}|${signedAt}`;
  return `NV-SIG-${sealGroups(seed, 2)}`;
}

export function fingerprintFor(doc: { docKey: string; contentHash?: string | null }, signer: { sid: string }, signedAt?: string | null) {
  if (!signedAt) return "";
  const seed = `${sealSeed(doc, signer)}|${signedAt}|h`;
  return sealGroups(seed, 4);
}

export function deriveSeal(
  doc: { docKey: string; contentHash?: string | null },
  signer: SignerLike,
) {
  const signed = !!signer.signedAt;
  const id = signed
    ? (signer.sealId || sealIdFor(doc, signer, signer.signedAt))
    : "";
  const fingerprint = signed
    ? (signer.fingerprint || fingerprintFor(doc, signer, signer.signedAt))
    : "";
  return {
    pending: !signed,
    id: id || "PENDING",
    fingerprint: fingerprint || "—",
    qrPayload: id || "PENDING",
    verified: signed,
    name: signer.name,
    signedAt: signer.signedAt || null,
  };
}

export function chainHeadIndex(signers: SignerLike[] = []) {
  return signers.findIndex((s) => !s.signedAt);
}

export function isChainComplete(signers: SignerLike[] = []) {
  return signers.length > 0 && signers.every((s) => !!s.signedAt);
}

export function deriveDocStatus(doc: SigningDocLike, actorUserId?: string | null) {
  const signers = doc.signers || [];
  const head = chainHeadIndex(signers);
  const done = isChainComplete(signers);
  const pending = signers.filter((s) => !s.signedAt).length;
  const yourTurn = head >= 0 && !!actorUserId && signers[head]?.userId === actorUserId;
  return {
    done,
    pending,
    headIndex: head,
    headSid: head >= 0 ? signers[head].sid : null,
    yourTurn,
    status: done ? "completed" : yourTurn ? "your_turn" : pending > 0 ? "awaiting" : "empty",
  };
}

export function checkRaiseGate(input: {
  source?: string | null;
  sourceRef?: string | null;
  title?: string | null;
  signers?: SignerLike[] | null;
}) {
  const source = String(input.source || "").trim();
  if (!SIGNING_SOURCES.includes(source as SigningSource)) {
    return {
      ok: false as const,
      error: "SOURCE_REQUIRED",
      reason: "مستند التوقيع يُنشأ من قسم مصدر (إثبات عمل / رواتب / إجازة) — لا يدويًا بلا مصدر.",
      reasonEn: "A signing document must be raised from a source section (work proof / payroll / leave) — not by hand without a source.",
    };
  }
  if (!String(input.sourceRef || "").trim()) {
    return {
      ok: false as const,
      error: "SOURCE_REF_REQUIRED",
      reason: "مرجع المصدر مطلوب لربط سلسلة التوقيع.",
      reasonEn: "A source reference is required to link the signing chain.",
    };
  }
  if (!String(input.title || "").trim()) {
    return {
      ok: false as const,
      error: "TITLE_REQUIRED",
      reason: "عنوان المستند مطلوب.",
      reasonEn: "Document title is required.",
    };
  }
  const signers = input.signers || [];
  if (signers.length < 1) {
    return {
      ok: false as const,
      error: "SIGNERS_REQUIRED",
      reason: "يلزم موقّع واحد على الأقل.",
      reasonEn: "At least one signer is required.",
    };
  }
  return { ok: true as const, source: source as SigningSource };
}

export function checkSignGate(
  doc: SigningDocLike | null | undefined,
  actor: { sid?: string | null; userId?: string | null },
) {
  if (!doc) {
    return {
      ok: false as const,
      error: "DOC_NOT_FOUND",
      reason: "مستند التوقيع غير موجود.",
      reasonEn: "Signing document not found.",
    };
  }
  const signers = doc.signers || [];
  if (isChainComplete(signers)) {
    return {
      ok: false as const,
      error: "CHAIN_COMPLETE",
      reason: "اكتملت التواقيع على هذا المستند.",
      reasonEn: "All signatures on this document are already complete.",
    };
  }
  const head = chainHeadIndex(signers);
  if (head < 0) {
    return {
      ok: false as const,
      error: "CHAIN_EMPTY",
      reason: "لا موقّعين في السلسلة.",
      reasonEn: "No signers in the chain.",
    };
  }
  const next = signers[head];
  const actorSid = String(actor.sid || "").trim();
  const actorUserId = String(actor.userId || "").trim();
  const isHead =
    (actorSid && actorSid === next.sid)
    || (actorUserId && next.userId && actorUserId === next.userId);
  if (!isHead) {
    return {
      ok: false as const,
      error: "NOT_YOUR_TURN",
      reason: `ليس دورك — بانتظار ${next.name}.`,
      reasonEn: `Not your turn — waiting for ${next.name}.`,
      headSid: next.sid,
      headName: next.name,
    };
  }
  if (next.signedAt) {
    return {
      ok: false as const,
      error: "ALREADY_SIGNED",
      reason: "وقّعت هذا الدور مسبقًا.",
      reasonEn: "You already signed this step.",
    };
  }
  return { ok: true as const, headIndex: head, signer: next };
}

export function checkVerifySealGate(
  doc: SigningDocLike | null | undefined,
  sid: string,
) {
  if (!doc) {
    return {
      ok: false as const,
      error: "DOC_NOT_FOUND",
      reason: "مستند التوقيع غير موجود.",
      reasonEn: "Signing document not found.",
    };
  }
  const signer = (doc.signers || []).find((s) => s.sid === sid);
  if (!signer) {
    return {
      ok: false as const,
      error: "SIGNER_NOT_FOUND",
      reason: "الموقّع غير موجود في السلسلة.",
      reasonEn: "Signer not found in the chain.",
    };
  }
  if (!signer.signedAt) {
    return {
      ok: false as const,
      error: "PENDING_SEAL",
      reason: "الختم بانتظار التوقيع — لا تحقق بعد.",
      reasonEn: "Seal is still PENDING — nothing to verify yet.",
    };
  }
  const expectedId = sealIdFor(doc, signer, signer.signedAt);
  const expectedFp = fingerprintFor(doc, signer, signer.signedAt);
  if (signer.sealId !== expectedId || signer.fingerprint !== expectedFp) {
    return {
      ok: false as const,
      error: "SEAL_MISMATCH",
      reason: "البصمة غير مطابقة — يُحتمل أن المستند عُدِّل بعد التوقيع.",
      reasonEn: "Seal mismatch — the document may have been altered after signing.",
      expectedId,
      expectedFp,
    };
  }
  return { ok: true as const, sealId: expectedId, fingerprint: expectedFp };
}

export function checkSendSignedGate(doc: SigningDocLike | null | undefined) {
  if (!doc) {
    return {
      ok: false as const,
      error: "DOC_NOT_FOUND",
      reason: "مستند التوقيع غير موجود.",
      reasonEn: "Signing document not found.",
    };
  }
  if (doc.sentAt) {
    return {
      ok: false as const,
      error: "ALREADY_SENT",
      reason: "النسخة الموقّعة أُرسلت مسبقًا.",
      reasonEn: "The signed copy was already sent.",
    };
  }
  if (!isChainComplete(doc.signers || [])) {
    return {
      ok: false as const,
      error: "CHAIN_INCOMPLETE",
      reason: "لا إرسال قبل اكتمال كل التواقيع في السلسلة.",
      reasonEn: "Cannot send before every signature in the chain is complete.",
    };
  }
  return { ok: true as const };
}

export function enrichSigningDoc(doc: SigningDocLike, actorUserId?: string | null) {
  const signers = (doc.signers || []).map((s) => ({
    ...s,
    seal: deriveSeal(doc, s),
  }));
  return {
    ...doc,
    signers,
    ...deriveDocStatus(doc, actorUserId),
  };
}

export function deriveSigningStats(docs: SigningDocLike[] = [], actorUserId?: string | null) {
  const enriched = docs.map((d) => deriveDocStatus(d, actorUserId));
  return {
    total: docs.length,
    completed: enriched.filter((d) => d.done).length,
    yourTurn: enriched.filter((d) => d.yourTurn).length,
    awaiting: enriched.filter((d) => !d.done).length,
  };
}
