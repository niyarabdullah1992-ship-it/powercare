import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Client-facing work proof registry.
// - issue:  a logged-in company session publishes a redacted proof snapshot.
// - lookup: PUBLIC — anyone holding the proof link/QR reads the redacted report.
// - list:   a logged-in company session lists its own issued proofs.
// - revoke: a logged-in company session withdraws a published proof.
async function requireSession(base44: any, body: any) {
  const platformUser = await base44.auth.me().catch(() => null);
  if (platformUser && platformUser.role === 'admin') return { ok: true, session: null };
  const sessionToken = String(body.sessionToken || '');
  const companyId = String(body.companyId || '');
  if (!sessionToken || !companyId) return { ok: false };
  const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: sessionToken, companyId });
  const session = sessions[0];
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return { ok: false };
  return { ok: true, session };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const Proofs = base44.asServiceRole.entities.ClientProof;

    if (action === 'lookup') {
      const proofId = String(body.proofId || '').slice(0, 40);
      if (!proofId) return Response.json({ error: 'proofId required' }, { status: 400 });
      const rows = await Proofs.filter({ proofId });
      if (rows.length === 0) return Response.json({ found: false });
      const r = rows[0];
      if (r.revoked) return Response.json({ found: true, revoked: true, proofId: r.proofId });
      return Response.json({
        found: true,
        revoked: false,
        proofId: r.proofId,
        contentHash: r.contentHash,
        companyName: r.companyName,
        clientName: r.clientName,
        projectName: r.projectName,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        issuedByName: r.issuedByName,
        issuedAt: r.issuedAt,
        payload: r.payload || {},
      });
    }

    const auth = await requireSession(base44, body);
    if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = String(body.companyId || '').slice(0, 64);

    if (action === 'issue') {
      const proofId = String(body.proofId || '').slice(0, 40);
      const contentHash = String(body.contentHash || '').toLowerCase().slice(0, 64);
      if (!proofId || !/^[0-9a-f]{64}$/.test(contentHash)) {
        return Response.json({ error: 'proofId and a valid SHA-256 contentHash are required' }, { status: 400 });
      }
      const existing = await Proofs.filter({ proofId });
      if (existing.length > 0) {
        console.error('clientProof: duplicate proofId', proofId);
        return Response.json({ error: 'PROOF_EXISTS' }, { status: 409 });
      }
      const rec = await Proofs.create({
        proofId,
        contentHash,
        companyId,
        companyName: String(body.companyName || '').slice(0, 160),
        stationId: body.stationId ? String(body.stationId).slice(0, 64) : null,
        stationName: body.stationName ? String(body.stationName).slice(0, 160) : null,
        clientName: String(body.clientName || '').slice(0, 160),
        projectName: String(body.projectName || '').slice(0, 160),
        periodStart: body.periodStart || null,
        periodEnd: body.periodEnd || null,
        issuedById: String(body.issuedById || '').slice(0, 64),
        issuedByName: String(body.issuedByName || '').slice(0, 120),
        issuedAt: new Date().toISOString(),
        payload: body.payload || {},
        revoked: false,
      });
      return Response.json({ ok: true, id: rec.id, proofId, issuedAt: rec.issuedAt });
    }

    if (action === 'list') {
      if (!companyId) return Response.json({ error: 'companyId required' }, { status: 400 });
      const rows = await Proofs.filter({ companyId }, '-issuedAt', 100);
      return Response.json({
        proofs: rows.map((r: any) => ({
          proofId: r.proofId, contentHash: r.contentHash, clientName: r.clientName,
          stationId: r.stationId || null, stationName: r.stationName || null,
          projectName: r.projectName, issuedAt: r.issuedAt, issuedByName: r.issuedByName,
          revoked: !!r.revoked, itemCount: (r.payload?.items || []).length,
        })),
      });
    }

    if (action === 'revoke') {
      const proofId = String(body.proofId || '').slice(0, 40);
      const rows = await Proofs.filter({ proofId, companyId });
      if (rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
      await Proofs.update(rows[0].id, { revoked: true });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('clientProof error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});