import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Document verification registry:
// - register: stores (verificationId, SHA-256 hash, signer, timestamp) for a freshly
//   signed document. A verificationId can only ever be bound to ONE file hash —
//   this makes reusing a signature badge on a different file impossible.
// - verify: given a file's SHA-256 hash, returns 'valid' (with signer details),
//   'tampered' (a known verificationId exists but the hash doesn't match), or 'unknown'.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const Docs = base44.asServiceRole.entities.SignedDocument;

    if (action === 'register') {
      // Registration is NOT public: only a logged-in user (owner/employee session
      // issued after email-verified login, or the platform builder) may register
      // a signature — and employees may only register as themselves.
      const platformUser = await base44.auth.me().catch(() => null);
      if (!platformUser || platformUser.role !== 'admin') {
        const sessionToken = String(body.sessionToken || '');
        const companyId = String(body.companyId || '');
        let session = null;
        if (sessionToken && companyId) {
          const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: sessionToken, companyId });
          const s = sessions[0];
          if (s && new Date(s.expiresAt).getTime() > Date.now()) session = s;
        }
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        // Identity boundary: an employee session can only register its own signature.
        if (session.userId && String(body.signerId || '') !== session.userId) {
          return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
      const verificationId = String(body.verificationId || '').slice(0, 40);
      const fileHash = String(body.fileHash || '').toLowerCase().slice(0, 64);
      if (!verificationId || !/^[0-9a-f]{64}$/.test(fileHash)) {
        return Response.json({ error: 'verificationId and a valid SHA-256 fileHash are required' }, { status: 400 });
      }
      // Signature-reuse protection: one verification ID ↔ one file hash, forever.
      const existing = await Docs.filter({ verificationId });
      if (existing.length > 0) {
        console.error('signedDocs: reuse attempt for', verificationId);
        return Response.json({ error: 'SIGNATURE_REUSE' }, { status: 409 });
      }
      const rec = await Docs.create({
        verificationId,
        fileHash,
        signerName: String(body.signerName || '').slice(0, 120),
        signerId: String(body.signerId || '').slice(0, 64),
        companyId: String(body.companyId || '').slice(0, 64),
        fileName: String(body.fileName || '').slice(0, 200),
        signedAt: new Date().toISOString(),
      });
      return Response.json({ ok: true, id: rec.id });
    }

    if (action === 'lookup') {
      const verificationId = String(body.verificationId || '').slice(0, 40);
      if (!verificationId) return Response.json({ error: 'verificationId required' }, { status: 400 });
      const rows = await Docs.filter({ verificationId });
      if (rows.length === 0) return Response.json({ found: false });
      const r = rows[0];
      return Response.json({
        found: true,
        verificationId: r.verificationId,
        signerName: r.signerName,
        fileName: r.fileName,
        signedAt: r.signedAt || r.created_date,
      });
    }

    if (action === 'verify') {
      const fileHash = String(body.fileHash || '').toLowerCase().slice(0, 64);
      if (!/^[0-9a-f]{64}$/.test(fileHash)) {
        return Response.json({ error: 'A valid SHA-256 fileHash is required' }, { status: 400 });
      }
      const byHash = await Docs.filter({ fileHash });
      if (byHash.length > 0) {
        const r = byHash[0];
        return Response.json({
          status: 'valid',
          verificationId: r.verificationId,
          signerName: r.signerName,
          fileName: r.fileName,
          signedAt: r.signedAt || r.created_date,
        });
      }
      // Hash not found — if the user typed the badge's verification ID and it exists,
      // the badge was lifted from another file → tampered.
      const verificationId = String(body.verificationId || '').slice(0, 40);
      if (verificationId) {
        const byId = await Docs.filter({ verificationId });
        if (byId.length > 0) {
          const r = byId[0];
          return Response.json({ status: 'tampered', signerName: r.signerName, signedAt: r.signedAt || r.created_date });
        }
      }
      return Response.json({ status: 'unknown' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('signedDocs error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});