import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const managerRoles = ["director", "ops_manager", "pgm", "station_manager"];
const seniorRoles = ["owner", "director", "ops_manager"];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
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
      const existing = await base44.asServiceRole.entities.WorkProof.filter({ companyId: auth.companyId });
      const year = new Date().getFullYear();
      const proofNumber = `WP-${year}-${String(existing.length + 1).padStart(6, "0")}`;
      const created = await base44.asServiceRole.entities.WorkProof.create({
        companyId: auth.companyId, proofNumber, stationId,
        workTitle, workDescription: String(body.workDescription || ""), workDate,
        beforeImageUrls: clean(body.beforeImageUrls), afterImageUrls: clean(body.afterImageUrls),
        performedById: auth.userId || "owner", performedByName: auth.name,
        clientName: null, clientTitle: null, clientSignatureUrl: null, signedAt: null,
        status: "pending_signature",
      });
      return Response.json({ ok: true, proof: created });
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