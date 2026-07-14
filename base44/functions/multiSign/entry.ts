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

async function authSession(base44, companyId, sessionToken) {
  const user = await base44.auth.me().catch(() => null);
  if (user && user.role === 'admin') return true;
  if (!companyId || !sessionToken) return false;
  const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: sessionToken, companyId });
  const s = sessions[0];
  return !!(s && new Date(s.expiresAt).getTime() > Date.now());
}

// Send via the connected Gmail account first (works for ANY external address —
// gmail, outlook, corporate…); fall back to the platform mailer if Gmail fails.
async function sendMail(base44, to, subject, bodyText) {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    // Microsoft (Outlook/Hotmail) rejects mail whose From address doesn't match
    // the sending Gmail account (SPF/DKIM spoof detection) — always send from
    // the real connected address.
    const prof = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const senderAddr = prof?.emailAddress;
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
      if (!(await authSession(base44, companyId, sessionToken))) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const signersIn = Array.isArray(body.signers) ? body.signers.slice(0, 100) : [];
      const signers = signersIn
        .map((s) => ({
          token: rid(),
          name: String(s.name || '').slice(0, 120),
          email: String(s.email || '').toLowerCase().trim().slice(0, 160),
          status: 'pending',
          signedAt: null,
          // Creator-assigned signing spot: this signer may ONLY sign here.
          spot:
            s.spot && typeof s.spot === 'object'
              ? { page: Math.max(1, Number(s.spot.page) || 1), x: Number(s.spot.x) || 0, y: Number(s.spot.y) || 0 }
              : null,
        }))
        .filter((s) => s.name && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email));
      if (signers.length === 0 || !body.docUrl || !body.fileName) {
        return Response.json({ error: 'Document and at least one valid signer are required' }, { status: 400 });
      }
      const rec = await Docs.create({
        companyId: String(companyId).slice(0, 64),
        creatorId: String(body.creatorId || '').slice(0, 64),
        creatorName: String(body.creatorName || '').slice(0, 120),
        creatorEmail: String(body.creatorEmail || '').toLowerCase().slice(0, 160),
        fileName: String(body.fileName).slice(0, 200),
        docUrl: String(body.docUrl).slice(0, 2000),
        verificationId: String(body.verificationId || '').slice(0, 40),
        finalHash: null,
        status: 'pending',
        signers,
      });
      // Email each signer their personal signing link.
      const appUrl = String(body.appUrl || '').replace(/\/+$/, '').slice(0, 300);
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
      if (!(await authSession(base44, companyId, sessionToken))) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const userId = String(body.userId || '');
      const email = String(body.email || '').toLowerCase();
      const rows = await Docs.filter({ companyId }, '-created_date', 100);
      const mine = rows
        .filter((r) => r.creatorId === userId || (r.signers || []).some((s) => s.email === email))
        .map((r) => {
          const mySigner = (r.signers || []).find((s) => s.email === email);
          return {
            id: r.id,
            fileName: r.fileName,
            creatorName: r.creatorName,
            status: r.status,
            createdAt: r.created_date,
            docUrl: r.docUrl,
            isCreator: r.creatorId === userId,
            myStatus: mySigner ? mySigner.status : null,
            myToken: mySigner ? `${r.id}.${mySigner.token}` : null,
            signers: (r.signers || []).map((s) => ({ name: s.name, email: s.email, status: s.status, signedAt: s.signedAt })),
          };
        });
      return Response.json({ requests: mine });
    }

    // ---- PUBLIC (token-authorized) actions ----
    const resolveToken = async (token) => {
      const [id, part] = String(token || '').split('.');
      if (!id || !part) return null;
      const rec = await Docs.get(id).catch(() => null);
      if (!rec) return null;
      const signer = (rec.signers || []).find((s) => s.token === part);
      return signer ? { rec, signer } : null;
    };

    if (action === 'getByToken') {
      const found = await resolveToken(body.token);
      if (!found) return Response.json({ error: 'Invalid or expired signing link' }, { status: 404 });
      const { rec, signer } = found;
      const pending = (rec.signers || []).filter((s) => s.status === 'pending');
      return Response.json({
        fileName: rec.fileName,
        creatorName: rec.creatorName,
        docUrl: rec.docUrl,
        status: rec.status,
        verificationId: rec.verificationId,
        signer: { name: signer.name, email: signer.email, status: signer.status, spot: signer.spot || null },
        signedCount: (rec.signers || []).filter((s) => s.status === 'signed').length,
        totalCount: (rec.signers || []).length,
        isLast: signer.status === 'pending' && pending.length === 1,
        signerNames: (rec.signers || []).map((s) => s.name).join(', '),
      });
    }

    if (action === 'submitSignature') {
      const found = await resolveToken(body.token);
      if (!found) return Response.json({ error: 'Invalid or expired signing link' }, { status: 404 });
      const { rec, signer } = found;
      if (signer.status === 'signed') return Response.json({ error: 'ALREADY_SIGNED' }, { status: 409 });
      const newDocUrl = String(body.newDocUrl || '').slice(0, 2000);
      if (!newDocUrl) return Response.json({ error: 'newDocUrl required' }, { status: 400 });

      const signers = (rec.signers || []).map((s) =>
        s.token === signer.token ? { ...s, status: 'signed', signedAt: new Date().toISOString() } : s
      );
      const completed = signers.every((s) => s.status === 'signed');
      const fileHash = String(body.fileHash || '').toLowerCase().slice(0, 64);
      await Docs.update(rec.id, {
        signers,
        docUrl: newDocUrl,
        status: completed ? 'completed' : 'pending',
        finalHash: completed && fileHash ? fileHash : rec.finalHash,
      });

      if (completed) {
        // Register the final file fingerprint in the verification registry.
        if (rec.verificationId && /^[0-9a-f]{64}$/.test(fileHash)) {
          const Registry = base44.asServiceRole.entities.SignedDocument;
          const existing = await Registry.filter({ verificationId: rec.verificationId });
          if (existing.length === 0) {
            await Registry.create({
              verificationId: rec.verificationId,
              fileHash,
              signerName: signers.map((s) => s.name).join(', ').slice(0, 120),
              signerId: rec.creatorId,
              companyId: rec.companyId,
              fileName: rec.fileName,
              signedAt: new Date().toISOString(),
            });
          }
        }
        if (rec.creatorEmail) {
          const ar = body.lang === 'ar';
          await sendMail(
            base44,
            rec.creatorEmail,
            ar ? `اكتمل التوقيع: ${rec.fileName}` : `All signatures collected: ${rec.fileName}`,
            ar
              ? `اكتمل توقيع جميع الأطراف على المستند "${rec.fileName}".\n\nرابط النسخة النهائية الموقّعة:\n${newDocUrl}\n\n— PowerCare`
              : `All parties have signed "${rec.fileName}".\n\nFinal signed copy:\n${newDocUrl}\n\n— PowerCare`
          );
        }
      }
      return Response.json({ ok: true, completed, docUrl: newDocUrl });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('multiSign error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});