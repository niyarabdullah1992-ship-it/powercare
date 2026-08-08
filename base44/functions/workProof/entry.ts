import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendGmail } from '../../shared/gmailSend.ts';

// Public view of a proof — only what the client needs to sign, never internal ids.
const publicView = (proof) => ({
  proofNumber: proof.proofNumber,
  workTitle: proof.workTitle,
  workDescription: proof.workDescription,
  workDate: proof.workDate,
  actualDays: proof.actualDays,
  plannedDays: proof.plannedDays,
  performedByName: proof.performedByName,
  employeeSignatureUrl: proof.employeeSignatureUrl || null,
  employeeSignedAt: proof.employeeSignedAt || null,
  beforeImageUrls: proof.beforeImageUrls || [],
  afterImageUrls: proof.afterImageUrls || [],
  workers: (proof.workers || []).map((w) => ({ name: w.name })),
  vehicles: (proof.vehicles || []).map((v) => ({ plate: v.plate, type: v.type, make: v.make, model: v.model, year: v.year })),
  status: proof.status,
  clientName: proof.clientName,
  clientTitle: proof.clientTitle || null,
  clientSignatureUrl: proof.clientSignatureUrl || null,
  signedAt: proof.signedAt,
});

const managerRoles = ["director", "ops_manager", "pgm", "station_manager"];
const seniorRoles = ["owner", "director", "ops_manager"];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // ---- Public (client-facing) actions: authenticated only by the emailed sign token.
    if (body.action === "publicGet" || body.action === "publicSign") {
      const token = String(body.token || "").trim();
      if (token.length < 20) return Response.json({ error: "Invalid link" }, { status: 400 });
      const found = await base44.asServiceRole.entities.WorkProof.filter({ signToken: token });
      const proof = found[0];
      if (!proof) return Response.json({ error: "Link not found or expired" }, { status: 404 });
      if (body.action === "publicGet") return Response.json({ proof: publicView(proof) });
      // The client never types their name — it is taken from the record prepared when the link was sent.
      const signatureUrl = String(body.signatureUrl || "").trim();
      if (proof.status !== "pending_signature") return Response.json({ error: "This proof is no longer awaiting signature" }, { status: 400 });
      if (!proof.clientName || !signatureUrl.startsWith("http")) return Response.json({ error: "Signature is required" }, { status: 400 });
      await base44.asServiceRole.entities.WorkProof.update(proof.id, {
        clientSignatureUrl: signatureUrl, signedAt: new Date().toISOString(), status: "signed", signToken: null,
      });
      return Response.json({ ok: true });
    }

    const platformUser = await base44.auth.me().catch(() => null);
    let auth = null;
    if (platformUser?.role === "admin" && body.companyId) auth = { companyId: body.companyId, userId: body.userId || null, role: "owner", name: platformUser.full_name || "Admin", stationId: null, managedStations: [] };
    if (!auth && body.sessionToken && body.companyId) {
      const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: body.sessionToken, companyId: body.companyId });
      const session = sessions[0];
      if (session && new Date(session.expiresAt).getTime() > Date.now()) {
        if (session.role === "owner") auth = { companyId: body.companyId, userId: session.userId || null, role: "owner", name: "Owner", stationId: null, managedStations: [] };
        else {
          const employees = await base44.asServiceRole.entities.Employee.filter({ companyId: body.companyId, employeeId: session.userId });
          const employee = employees[0];
          if (employee) auth = { companyId: body.companyId, userId: employee.employeeId, role: employee.role, name: employee.name, stationId: employee.stationId || null, managedStations: employee.managedStations || [] };
        }
      }
    }
    if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const isSenior = seniorRoles.includes(auth.role);
    const isManager = managerRoles.includes(auth.role) || auth.role === "owner";
    const allStations = await base44.asServiceRole.entities.Station.filter({ companyId: auth.companyId });
    const visibleStationIds = isSenior ? allStations.map((s) => s.stationId) : auth.role === "pgm" ? auth.managedStations : auth.role === "station_manager" ? [auth.stationId, ...auth.managedStations].filter(Boolean) : [auth.stationId].filter(Boolean);

    if (body.action === "list") {
      const proofs = await base44.asServiceRole.entities.WorkProof.filter({ companyId: auth.companyId }, "-created_date", 500);
      const visible = isSenior ? proofs : isManager ? proofs.filter((p) => visibleStationIds.includes(p.stationId)) : proofs.filter((p) => p.performedById === auth.userId || visibleStationIds.includes(p.stationId));
      const stations = allStations.filter((s) => visibleStationIds.includes(s.stationId));
      return Response.json({ proofs: visible, stations });
    }

    if (body.action === "create") {
      const workTitle = String(body.workTitle || "").trim();
      const workDate = String(body.workDate || "").trim();
      const stationId = String(body.stationId || "").trim();
      if (!workTitle || !workDate || !stationId || !visibleStationIds.includes(stationId)) return Response.json({ error: "Invalid work proof data" }, { status: 400 });
      const clean = (urls) => (Array.isArray(urls) ? urls.filter((u) => typeof u === "string" && u.startsWith("http")).slice(0, 10) : []);
      const cleanFiles = (files) => (Array.isArray(files) ? files.filter((f) => typeof f?.url === "string" && f.url.startsWith("http")).slice(0, 10).map((f) => ({ url: f.url, name: String(f.name || "file") })) : []);
      const idTypes = ["national_id", "iqama", "passport", "other"];
      const workers = (Array.isArray(body.workers) ? body.workers : []).filter((w) => String(w?.name || "").trim()).slice(0, 50).map((w) => ({
        name: String(w.name).trim(),
        idType: idTypes.includes(w.idType) ? w.idType : "other",
        idNumber: String(w.idNumber || "").trim(),
        phone: String(w.phone || "").trim(),
      }));
      const vehicles = (Array.isArray(body.vehicles) ? body.vehicles : []).filter((v) => String(v?.plate || "").trim()).slice(0, 30).map((v) => ({
        plate: String(v.plate).trim(),
        type: String(v.type || "").trim(),
        make: String(v.make || "").trim(),
        model: String(v.model || "").trim(),
        year: String(v.year || "").trim(),
        driverName: String(v.driverName || "").trim(),
      }));
      const plannedDays = body.plannedDays == null || body.plannedDays === "" ? null : Number(body.plannedDays);
      if (plannedDays != null && (!Number.isFinite(plannedDays) || plannedDays < 0)) return Response.json({ error: "Invalid planned days" }, { status: 400 });
      const existing = await base44.asServiceRole.entities.WorkProof.filter({ companyId: auth.companyId });
      const year = new Date().getFullYear();
      const proofNumber = `WP-${year}-${String(existing.length + 1).padStart(6, "0")}`;
      const created = await base44.asServiceRole.entities.WorkProof.create({
        companyId: auth.companyId, proofNumber, stationId,
        workTitle, workDescription: String(body.workDescription || ""), workDate,
        workers, vehicles, plannedDays, actualDays: null, closedAt: null,
        beforeImageUrls: clean(body.beforeImageUrls), afterImageUrls: [],
        beforeFiles: cleanFiles(body.beforeFiles), afterFiles: [],
        performedById: auth.userId || "owner", performedByName: auth.name,
        clientName: null, clientTitle: null, clientSignatureUrl: null, signedAt: null,
        status: "in_progress",
      });
      return Response.json({ ok: true, proof: created });
    }

    if (body.action === "close") {
      const proofs = await base44.asServiceRole.entities.WorkProof.filter({ id: body.proofId, companyId: auth.companyId });
      const proof = proofs[0];
      if (!proof || proof.status !== "in_progress") return Response.json({ error: "Job cannot be closed" }, { status: 400 });
      if (!visibleStationIds.includes(proof.stationId) && proof.performedById !== auth.userId) return Response.json({ error: "Forbidden" }, { status: 403 });
      const actualDays = Number(body.actualDays);
      if (!Number.isFinite(actualDays) || actualDays < 0) return Response.json({ error: "Actual working days are required" }, { status: 400 });
      const after = Array.isArray(body.afterImageUrls) ? body.afterImageUrls.filter((u) => typeof u === "string" && u.startsWith("http")).slice(0, 10) : [];
      const afterFiles = Array.isArray(body.afterFiles) ? body.afterFiles.filter((f) => typeof f?.url === "string" && f.url.startsWith("http")).slice(0, 10).map((f) => ({ url: f.url, name: String(f.name || "file") })) : [];
      // The employee who documented the job signs it automatically at close, using their saved signature.
      let employeeSignatureUrl = proof.employeeSignatureUrl || null;
      if (!employeeSignatureUrl && auth.userId) {
        const employees = await base44.asServiceRole.entities.Employee.filter({ companyId: auth.companyId, employeeId: auth.userId });
        const saved = employees[0]?.profile?.signatureUrl;
        if (typeof saved === "string" && saved.startsWith("http")) employeeSignatureUrl = saved;
      }
      const closedAt = new Date().toISOString();
      await base44.asServiceRole.entities.WorkProof.update(proof.id, {
        actualDays, afterImageUrls: after, afterFiles, closedAt, status: "pending_signature",
        employeeSignatureUrl, employeeSignedAt: employeeSignatureUrl ? closedAt : null,
      });
      return Response.json({ ok: true });
    }

    if (body.action === "sendSignLink") {
      const clientEmail = String(body.clientEmail || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) return Response.json({ error: "A valid client email is required" }, { status: 400 });
      const proofs = await base44.asServiceRole.entities.WorkProof.filter({ id: body.proofId, companyId: auth.companyId });
      const proof = proofs[0];
      if (!proof || proof.status !== "pending_signature") return Response.json({ error: "Proof is not awaiting signature" }, { status: 400 });
      if (!visibleStationIds.includes(proof.stationId) && proof.performedById !== auth.userId) return Response.json({ error: "Forbidden" }, { status: 403 });
      const signToken = proof.signToken || crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const origin = String(body.origin || "").replace(/\/$/, "");
      const url = `${origin}/work-proof-sign?token=${signToken}`;
      await sendGmail(base44, {
        to: clientEmail,
        subject: `توقيع إثبات العمل ${proof.proofNumber} · Work proof signature`,
        text: `تم إنجاز العمل: ${proof.workTitle}\nبتاريخ ${proof.workDate} — بواسطة ${proof.performedByName}.\n\nيرجى مراجعة الإثبات والتوقيع إلكترونيًا عبر الزر أدناه.\n\nPlease review the work proof and sign it electronically.`,
        cta: { url, label: "مراجعة وتوقيع · Review & sign" },
      });
      const clientName = String(body.clientName || "").trim();
      if (!clientName) return Response.json({ error: "Client name is required" }, { status: 400 });
      await base44.asServiceRole.entities.WorkProof.update(proof.id, {
        signToken, clientEmail, clientName, clientTitle: String(body.clientTitle || "").trim() || null,
        signLinkSentAt: new Date().toISOString(),
      });
      return Response.json({ ok: true, url });
    }

    if (body.action === "sign") {
      const clientName = String(body.clientName || "").trim();
      const signatureUrl = String(body.signatureUrl || "").trim();
      const proofs = await base44.asServiceRole.entities.WorkProof.filter({ id: body.proofId, companyId: auth.companyId });
      const proof = proofs[0];
      if (!proof || proof.status !== "pending_signature") return Response.json({ error: "Proof cannot be signed" }, { status: 400 });
      if (!visibleStationIds.includes(proof.stationId) && proof.performedById !== auth.userId) return Response.json({ error: "Forbidden" }, { status: 403 });
      if (!clientName || !signatureUrl.startsWith("http")) return Response.json({ error: "Client name and signature are required" }, { status: 400 });
      // Signing seals the record: the client's identity, signature and timestamp are written once and never edited.
      await base44.asServiceRole.entities.WorkProof.update(proof.id, {
        clientName, clientTitle: String(body.clientTitle || "").trim() || null,
        clientSignatureUrl: signatureUrl, signedAt: new Date().toISOString(), status: "signed",
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("WorkProof error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}