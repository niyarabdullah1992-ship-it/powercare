import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { createMimeMessage } from 'npm:mimetext@3.0.24';

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Multi-party document signing:
// - create: an authenticated company user uploads a document and invites several
//   signers (company members or external emails). Each signer receives a unique
//   one-time signing link by email.
// - list: requests I created or where I'm a signer (session-authenticated).
// - getByToken / submitSignature: PUBLIC, authorized purely by the unguessable
//   per-signer token. Each signature stamps a new version of the document; when
//   the last signer finishes, the final file's SHA-256 fingerprint is registered
//   in the verification registry and the creator is notified.

const rid = () => crypto.randomUUID().replace(/-/g, '');
const isAllowedDocUrl = (value) => {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && Boolean(url.hostname) && url.username === '' && url.password === '';
  } catch {
    return false;
  }
};

async function authSession(base44, companyId, sessionToken) {
  const user = await base44.auth.me().catch(() => null);
  if (user && user.role === 'admin') return { admin: true, name: user.full_name || 'Admin', email: user.email || '' };
  if (!companyId || !sessionToken) return null;
  const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: sessionToken, companyId });
  const session = sessions[0];
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
  if (session.userId) {
    const employees = await base44.asServiceRole.entities.Employee.filter({ companyId, employeeId: session.userId });
    const employee = employees[0];
    return employee ? { userId: employee.employeeId, name: employee.name, email: String(employee.email || '').toLowerCase() } : null;
  }
  const [accounts, metaRows] = await Promise.all([
    base44.asServiceRole.entities.CompanyAccount.filter({ companyId }),
    base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId, category: 'companyMeta' }),
  ]);
  const account = accounts[0];
  if (!account) return null;
  const ownerId = metaRows[0]?.payload?.[0]?.ownerId || null;
  const owners = ownerId ? await base44.asServiceRole.entities.Employee.filter({ companyId, employeeId: ownerId }) : [];
  const owner = owners[0];
  return { owner: true, userId: ownerId, name: owner?.name || 'Owner', email: String(account.ownerEmail || '').toLowerCase() };
}

// Send via the connected Gmail account first (works for ANY external address —
// gmail, outlook, corporate…); fall back to the platform mailer if Gmail fails.
async function sendMail(base44, to, subject, bodyText) {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    // Microsoft (Outlook/Hotmail) rejects mail whose From address doesn't match
    // the sending Gmail account (SPF/DKIM spoof detection) — always send from
    // the real connected address.
    const prof = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const senderAddr = prof?.email;
    if (!senderAddr) throw new Error('gmail profile unavailable');
    const msg = createMimeMessage();
    msg.setSender({ name: 'PowerCare', addr: senderAddr });
    msg.setRecipient(to);
    msg.setSubject(subject);
    msg.addMessage({ contentType: 'text/plain', data: bodyText });
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: toBase64Url(msg.asRaw()) }),
    });
    if (res.ok) return true;
    console.error('multiSign gmail send failed for', to, JSON.stringify(await res.json().catch(() => ({}))));
  } catch (e) {
    console.error('multiSign gmail unavailable:', e.message);
  }
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'PowerCare',
      to,
      subject,
      body: bodyText,
    });
    return true;
  } catch (e) {
    console.error('multiSign email failed for', to, e.message);
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const Docs = base44.asServiceRole.entities.SignatureRequest;

    if (action === 'create') {
      const { companyId, sessionToken } = body;
      const actor = await authSession(base44, companyId, sessionToken);
      if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const signersIn = Array.isArray(body.signers) ? body.signers.slice(0, 100) : [];
      const signers = signersIn
        .map((s) => ({
          token: rid(),
          name: String(s.name || '').trim().slice(0, 120),
          email: String(s.email || '').toLowerCase().trim().slice(0, 160),
          status: 'pending',
          signedAt: null,
          // Creator-assigned signing spot: this signer may ONLY sign here.
          spot:
            s.spot && typeof s.spot === 'object'
              ? { page: Math.max(1, Number(s.spot.page) || 1), x: Math.min(100, Math.max(0, Number(s.spot.x) || 0)), y: Math.min(100, Math.max(0, Number(s.spot.y) || 0)), scale: Math.min(200, Math.max(50, Number(s.spot.scale) || 100)) }
              : null,
        }))
        .filter((s, index, rows) => s.name && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email) && rows.findIndex((row) => row.email === s.email) === index);
      if (signers.length === 0 || signers.length !== signersIn.length || !isAllowedDocUrl(body.docUrl) || !String(body.fileName || '').toLowerCase().endsWith('.pdf') || !String(body.verificationId || '').trim()) {
        return Response.json({ error: 'A PDF document and a valid, unique email for every signer are required' }, { status: 400 });
      }
      const duplicateRequests = await Docs.filter({ verificationId: String(body.verificationId).slice(0, 40) });
      if (duplicateRequests.length) return Response.json({ error: 'SIGNATURE_REUSE' }, { status: 409 });
      const rec = await Docs.create({
        companyId: String(companyId).slice(0, 64),
        creatorId: String(actor.userId || body.creatorId || '').slice(0, 64),
        creatorName: String(actor.admin ? (body.creatorName || actor.name) : actor.name).slice(0, 120),
        creatorEmail: String(actor.admin ? (body.creatorEmail || actor.email) : actor.email).toLowerCase().slice(0, 160),
        fileName: String(body.fileName).slice(0, 200),
        docUrl: String(body.docUrl).slice(0, 2000),
        verificationId: String(body.verificationId || '').slice(0, 40),
        finalHash: null,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        signers,
      });
      // Email each signer their personal signing link. The link host is never
      // trusted from the client — only known app domains are allowed, otherwise
      // the canonical published domain is used (prevents phishing-link injection).
      const resolveAppUrl = (raw) => {
        try {
          const u = new URL(String(raw || ''));
          const allowedHost = /^([a-z0-9-]+\.)*(powercares\.pro|base44\.app)$/i;
          if (u.protocol === 'https:' && allowedHost.test(u.hostname)) return u.origin;
        } catch (_e) { /* invalid URL — fall through to canonical domain */ }
        return 'https://powercares.pro';
      };
      const appUrl = resolveAppUrl(body.appUrl);
      const ar = body.lang === 'ar';
      const links = {};
      const emailFailed = [];
      for (const s of signers) {
        const link = `${appUrl}/sign?token=${rec.id}.${s.token}`;
        links[s.email] = link;
        if (appUrl) {
          const ok = await sendMail(
            base44,
            s.email,
            ar ? `طلب توقيع: ${rec.fileName}` : `Signature request: ${rec.fileName}`,
            ar
              ? `مرحبًا ${s.name}،\n\nطلب منك ${rec.creatorName} التوقيع على المستند "${rec.fileName}".\n\nللتوقيع افتح الرابط التالي:\n${link}\n\n— PowerCare`
              : `Hello ${s.name},\n\n${rec.creatorName} asked you to sign the document "${rec.fileName}".\n\nOpen this link to sign:\n${link}\n\n— PowerCare`
          );
          if (!ok) emailFailed.push(s.email);
        }
      }
      return Response.json({ ok: true, requestId: rec.id, links, emailFailed });
    }

    if (action === 'list') {
      const { companyId, sessionToken } = body;
      const actor = await authSession(base44, companyId, sessionToken);
      if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const userId = String(actor.userId || (actor.admin ? body.userId : '') || '');
      const email = String(actor.email || (actor.admin ? body.email : '') || '').toLowerCase();
      const rows = await Docs.filter({ companyId }, '-created_date', 100);
      const mine = rows
        .filter((r) => r.creatorId === userId || (!!email && r.creatorEmail === email) || (r.signers || []).some((s) => !!email && s.email === email))
        .map((r) => {
          const mySigner = (r.signers || []).find((s) => s.email === email);
          return {
            id: r.id,
            fileName: r.fileName,
            creatorName: r.creatorName,
            status: r.status,
            createdAt: r.created_date,
            docUrl: r.docUrl,
            isCreator: r.creatorId === userId || (!!email && r.creatorEmail === email),
            myStatus: mySigner ? mySigner.status : null,
            myToken: mySigner ? `${r.id}.${mySigner.token}` : null,
            signers: (r.signers || []).map((s) => ({ name: s.name, email: s.email, status: s.status, signedAt: s.signedAt })),
          };
        });
      return Response.json({ requests: mine });
    }

    if (action === 'delete') {
      const { companyId, sessionToken } = body;
      const actor = await authSession(base44, companyId, sessionToken);
      if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const rec = await Docs.get(String(body.requestId || '')).catch(() => null);
      if (!rec || rec.companyId !== companyId) {
        return Response.json({ error: 'Not found' }, { status: 404 });
      }
      const actorId = String(actor.userId || (actor.admin ? body.userId : '') || '');
      const actorEmail = String(actor.email || '').toLowerCase();
      if (rec.creatorId !== actorId && (!actorEmail || rec.creatorEmail !== actorEmail)) {
        return Response.json({ error: 'Only the creator can delete this request' }, { status: 403 });
      }
      await Docs.delete(rec.id);
      return Response.json({ ok: true });
    }

    // ---- PUBLIC (token-authorized) actions ----
    const resolveToken = async (token) => {
      const [id, part] = String(token || '').split('.');
      if (!id || !part) return null;
      const rec = await Docs.get(id).catch(() => null);
      if (!rec) return null;
      const signer = (rec.signers || []).find((s) => s.token === part);
      const expired = !!rec.expiresAt && new Date(rec.expiresAt).getTime() <= Date.now();
      return signer ? { rec, signer, expired } : null;
    };

    if (action === 'getByToken') {
      const found = await resolveToken(body.token);
      if (!found) return Response.json({ error: 'Invalid or expired signing link' }, { status: 404 });
      const { rec, signer, expired } = found;
      if (expired) {
        return Response.json({ expiresAt: rec.expiresAt, signer: { name: signer.name, status: signer.status } });
      }
      const pending = (rec.signers || []).filter((s) => s.status === 'pending');
      return Response.json({
        fileName: rec.fileName,
        creatorName: rec.creatorName,
        docUrl: rec.docUrl,
        status: rec.status,
        expiresAt: rec.expiresAt,
        verificationId: rec.verificationId,
        signer: { name: signer.name, email: signer.email, status: signer.status, spot: signer.spot || null },
        signedCount: (rec.signers || []).filter((s) => s.status === 'signed').length,
        totalCount: (rec.signers || []).length,
        canSign: signer.status === 'signed' || pending[0]?.token === signer.token,
        isLast: signer.status === 'pending' && pending.length === 1,
        signerNames: (rec.signers || []).map((s) => s.name).join(', '),
      });
    }

    if (action === 'submitSignature') {
      const found = await resolveToken(body.token);
      if (!found) return Response.json({ error: 'Invalid or expired signing link' }, { status: 404 });
      const { rec, signer, expired } = found;
      if (expired) return Response.json({ error: 'Invalid or expired signing link' }, { status: 404 });
      if (rec.status !== 'pending' || signer.status === 'signed') return Response.json({ error: 'ALREADY_SIGNED' }, { status: 409 });
      const pending = (rec.signers || []).filter((item) => item.status === 'pending');
      if (pending[0]?.token !== signer.token) return Response.json({ error: 'WAIT_FOR_TURN' }, { status: 409 });
      const completingNow = pending.length === 1;
      const fileHash = String(body.fileHash || '').toLowerCase().slice(0, 64);
      if (completingNow && !/^[0-9a-f]{64}$/.test(fileHash)) return Response.json({ error: 'Final file fingerprint is required' }, { status: 400 });
      const newDocUrl = String(body.newDocUrl || '').slice(0, 2000);
      if (!isAllowedDocUrl(newDocUrl)) return Response.json({ error: 'A valid signed document URL is required' }, { status: 400 });

      const signers = (rec.signers || []).map((s) =>
        s.token === signer.token ? { ...s, status: 'signed', signedAt: new Date().toISOString() } : s
      );
      const completed = signers.every((s) => s.status === 'signed');
      let registryRecord = null;
      if (completed) {
        const Registry = base44.asServiceRole.entities.SignedDocument;
        const existing = await Registry.filter({ verificationId: rec.verificationId });
        if (existing.length) return Response.json({ error: 'SIGNATURE_REUSE' }, { status: 409 });
        registryRecord = await Registry.create({
          verificationId: rec.verificationId,
          fileHash,
          signerName: signers.map((s) => s.name).join(', ').slice(0, 120),
          signerId: rec.creatorId,
          companyId: rec.companyId,
          fileName: rec.fileName,
          signedAt: new Date().toISOString(),
        });
      }
      try {
        await Docs.update(rec.id, {
          signers,
          docUrl: newDocUrl,
          status: completed ? 'completed' : 'pending',
          finalHash: completed ? fileHash : rec.finalHash,
        });
      } catch (error) {
        if (registryRecord) await base44.asServiceRole.entities.SignedDocument.delete(registryRecord.id).catch(() => {});
        throw error;
      }

      if (completed && rec.creatorEmail) {
        const ar = body.lang === 'ar';
        const subject = ar ? `اكتمل التوقيع: ${rec.fileName}` : `All signatures collected: ${rec.fileName}`;
        const timeline = signers.map((item) => `${item.name}: ${new Date(item.signedAt).toISOString()}`).join('\n');
        const text = ar
          ? `اكتمل توقيع جميع الأطراف على المستند "${rec.fileName}".\n\nسجل الختم الزمني الموثّق:\n${timeline}`
          : `All parties have signed "${rec.fileName}".\n\nVerified signing timeline:\n${timeline}`;
        let notified = false;
        try {
          const notice = await base44.asServiceRole.functions.invoke('gmailNotify', {
            companyId: rec.companyId,
            to: rec.creatorEmail,
            subject,
            text,
            details: signers.map((item) => ({ label: item.name, value: new Date(item.signedAt).toISOString() })),
            cta: { label: ar ? 'فتح النسخة النهائية' : 'Open final copy', url: newDocUrl },
          });
          notified = notice?.data?.ok === true;
        } catch (error) {
          console.error('multiSign gmailNotify failed:', error.message);
        }
        if (!notified) await sendMail(base44, rec.creatorEmail, subject, `${text}\n\n${newDocUrl}\n\n— PowerCare`);
      }
      return Response.json({ ok: true, completed, docUrl: newDocUrl });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('multiSign error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});