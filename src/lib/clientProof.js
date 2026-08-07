import { sha256HexOfBuffer } from "@/lib/fileHash";

// Builds the redacted, client-facing proof payload out of internal task records.
// Employee identities never leave the company — the client sees WHAT was done,
// WHERE, WHEN and with how much field evidence, nothing else.

export function newProofId() {
  const block = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NV-${block()}-${block()}-${block()}`;
}

export function proofItemFromTask(task, stationName) {
  const proof = Array.isArray(task.completion_proof) ? task.completion_proof : [];
  return {
    title: task.title || "",
    station: stationName || "",
    status: task.status,
    completed: Number(task.completed_tasks) || 0,
    target: Number(task.task_target) || 0,
    startDate: task.start_date || null,
    endDate: task.end_date || null,
    photoEvidence: proof.filter((entry) => entry.url).length,
    attestations: proof.filter((entry) => entry.type === "attestation").length,
    verifiedOnSite: (task.completionMode || "onsite") === "onsite",
  };
}

// Canonical JSON — key order is fixed by construction, so the same content
// always produces the same hash on any device.
export function canonicalPayload(payload) {
  return JSON.stringify({
    clientName: payload.clientName,
    projectName: payload.projectName,
    periodStart: payload.periodStart,
    periodEnd: payload.periodEnd,
    items: payload.items.map((item) => [
      item.title, item.station, item.status, item.completed, item.target,
      item.startDate, item.endDate, item.photoEvidence, item.attestations, item.verifiedOnSite,
    ]),
  });
}

export async function proofContentHash(payload) {
  const bytes = new TextEncoder().encode(canonicalPayload(payload));
  return sha256HexOfBuffer(bytes);
}

export function proofPublicUrl(proofId) {
  return `${window.location.origin}/proof?id=${encodeURIComponent(proofId)}`;
}

export function proofQrUrl(proofId) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(proofPublicUrl(proofId))}`;
}