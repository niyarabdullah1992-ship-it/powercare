import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { createMimeMessage } from 'npm:mimetext@3.0.24';
import { authPowerCareSession } from '../../shared/powerCareSession.ts';
import { fetchWithRetry } from '../../shared/fetchRetry.ts';
import { POWERCARE_LOGO_URL } from '../../shared/brand.ts';

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
const trustedDocumentHosts = new Set(['media.base44.com', 'base44.app']);
const allowedStampThemes = new Set(['heritage', 'executive', 'minimal', 'certificate', 'vault', 'horizon']);
const isAllowedDocUrl = (value) => {
  try {
    const raw = String(value || '');
    if (!raw || raw.length > 2000) return false;
    const url = new URL(raw);
    return url.protocol === 'https:'
      && trustedDocumentHosts.has(url.hostname.toLowerCase())
      && (url.port === '' || url.port === '443')
      && url.username === ''
      && url.password === '';
  } catch {
    return false;
  }
};

const authSession = authPowerCareSession;

const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const cleanLocation = (value) => value?.available === true && Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lng)) ? { lat: Number(value.lat), lng: Number(value.lng), accuracy: Math.max(0, Number(value.accuracy) || 0) } : { available: false };

function signatureRequestEmail({ ar, signerName, creatorName, fileName, link, signerIndex = 0, totalSigners = 1, expiresAt }) {
  const direction = ar ? 'rtl' : 'ltr';
  const align = ar ? 'right' : 'left';
  const title = ar ? 'طلب توقيع مستند' : 'Document signature request';
  const greeting = ar ? `مرحبًا ${signerName}` : `Hello ${signerName}`;
  const intro = ar ? 'لديك مستند جديد بانتظار مراجعتك وتوقيعك الإلكتروني.' : 'A new document is waiting for your review and electronic signature.';
  const senderLabel = ar ? 'مرسل الطلب' : 'Requested by';
  const documentLabel = ar ? 'المستند المطلوب توقيعه' : 'Document to sign';
  const button = ar ? 'مراجعة المستند والتوقيع' : 'Review and sign document';
  const note = ar ? 'هذا الرابط آمن ومخصص لك فقط. يرجى عدم مشاركته مع أي شخص آخر.' : 'This secure link is unique to you. Please do not share it with anyone else.';
  const footer = ar ? 'توقيع إلكتروني موثّق وآمن' : 'Secure, verified electronic signing';
  const orderLabel = ar ? 'ترتيبك في مسار التوقيع' : 'Your place in the signing order';
  const expiryLabel = ar ? 'صلاحية رابط التوقيع' : 'Signing link expires';
  const expiryText = expiresAt ? new Date(expiresAt).toLocaleString(ar ? 'ar-SA' : 'en-GB', { timeZone: 'Asia/Riyadh' }) : '—';
  const securityLabel = ar ? 'مراجعة آمنة قبل التوقيع' : 'Secure review before signing';
  const securityText = ar ? 'ستراجع المستند وبيانات الطلب أولًا، ثم تنتقل إلى حقولك وتوقيعك المخصص.' : 'You will review the document and request details first, then continue to your assigned fields and signature.';

  return `<!doctype html>
<html lang="${ar ? 'ar' : 'en'}" dir="${direction}">
  <body style="margin:0;padding:0;background:#F7F8FA;color:#14284B;font-family:Arial,'Helvetica Neue',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F7F8FA;">
      <tr>
        <td align="center" style="padding:36px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;box-shadow:0 8px 28px rgba(20,40,75,0.08);">
            <tr>
              <td style="padding:28px 32px;background:#14284B;border-bottom:3px solid #1E9E63;text-align:${align};">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="vertical-align:middle;text-align:${align};">
                      <img src="${POWERCARE_LOGO_URL}" width="74" height="74" alt="NiroVera" style="display:inline-block;object-fit:contain;vertical-align:middle;" />
                    </td>
                  </tr>
                </table>
                <h1 style="margin:22px 0 0;color:#ffffff;font-size:26px;line-height:1.35;font-weight:700;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;text-align:${align};">
                <h2 style="margin:0 0 10px;color:#13283d;font-size:21px;line-height:1.5;font-weight:700;">${escapeHtml(greeting)}</h2>
                <p style="margin:0 0 26px;color:#52606d;font-size:15px;line-height:1.8;">${intro}</p>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:14px;background:#fbf9f4;border:1px solid #d9cfbb;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 18px;text-align:${align};">
                      <div style="margin-bottom:6px;color:#77818b;font-size:11px;font-weight:bold;letter-spacing:0.5px;">${senderLabel}</div>
                      <div style="color:#13283d;font-size:16px;font-weight:700;">${escapeHtml(creatorName)}</div>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border:1px solid #d9cfbb;border-radius:12px;">
                  <tr>
                    <td width="62" style="padding:18px 0 18px 18px;text-align:center;vertical-align:middle;">
                      <div style="display:inline-block;width:42px;height:42px;line-height:42px;background:#f7f4ed;border:1px solid #d9cfbb;border-radius:10px;color:#c7ad76;font-size:11px;font-weight:bold;text-align:center;">PDF</div>
                    </td>
                    <td style="padding:18px;text-align:${align};vertical-align:middle;">
                      <div style="margin-bottom:6px;color:#77818b;font-size:11px;font-weight:bold;letter-spacing:0.5px;">${documentLabel}</div>
                      <div style="color:#13283d;font-size:15px;font-weight:700;line-height:1.5;word-break:break-word;">${escapeHtml(fileName)}</div>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:14px;background:#fbf9f4;border:1px solid #d9cfbb;border-radius:12px;">
                  <tr>
                    <td width="50%" style="padding:16px 18px;text-align:${align};border-${ar ? 'left' : 'right'}:1px solid #d9cfbb;">
                      <div style="margin-bottom:6px;color:#77818b;font-size:11px;font-weight:bold;">${orderLabel}</div>
                      <div style="color:#13283d;font-size:15px;font-weight:700;">${signerIndex + 1} / ${totalSigners}</div>
                    </td>
                    <td width="50%" style="padding:16px 18px;text-align:${align};">
                      <div style="margin-bottom:6px;color:#77818b;font-size:11px;font-weight:bold;">${expiryLabel}</div>
                      <div style="color:#13283d;font-size:13px;font-weight:700;">${escapeHtml(expiryText)}</div>
                    </td>
                  </tr>
                </table>
                <div style="margin-top:14px;padding:16px 18px;background:#EAF6F0;border-left:3px solid #1E9E63;border-radius:10px;text-align:${align};">
                  <div style="margin-bottom:5px;color:#14284B;font-size:13px;font-weight:700;">${securityLabel}</div>
                  <div style="color:#5A6B85;font-size:12px;line-height:1.7;">${securityText}</div>
                </div>

                <div style="padding:30px 0 24px;text-align:center;">
                  <a href="${escapeHtml(link)}" style="display:inline-block;background:#1E9E63;color:#ffffff;text-decoration:none;padding:15px 28px;border-radius:10px;font-size:15px;font-weight:bold;line-height:1.2;box-shadow:0 5px 14px rgba(30,158,99,0.28);">${button}</a>
                </div>
                <p style="margin:0;padding-top:18px;border-top:1px solid #E2E8F0;color:#5A6B85;font-size:12px;line-height:1.8;text-align:center;">${note}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#F7F8FA;border-top:1px solid #E2E8F0;color:#5A6B85;font-size:11px;line-height:1.6;text-align:center;">
                <strong style="color:#14284B;">NiroVera</strong> · ${footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// Send via the connected Gmail account first (works for ANY external address —
// gmail, outlook, corporate…); fall back to the platform mailer if Gmail fails.
async function sendMail(base44, to, subject, bodyText, bodyHtml = '') {
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
    msg.setSender({ name: 'NiroVera', addr: senderAddr });
    msg.setRecipient(to);
    msg.setSubject(subject);
    msg.addMessage({ contentType: 'text/plain', data: bodyText });
    if (bodyHtml) msg.addMessage({ contentType: 'text/html', data: bodyHtml });
    const res = await fetchWithRetry('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
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
      from_name: 'NiroVera',
      to,
      subject,
      body: bodyHtml || bodyText,
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
      const creatorRoles = new Set(['owner', 'director', 'ops_manager', 'pgm', 'station_manager']);
      if (!actor.admin && !creatorRoles.has(actor.role) && !actor.hrLevelId) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const signersIn = Array.isArray(body.signers) ? body.signers.slice(0, 100) : [];
      const signers = signersIn
        .map((s) => ({
          token: rid(),
          name: String(s.name || '').trim().slice(0, 120),
          email: String(s.email || '').toLowerCase().trim().slice(0, 160),
          status: 'pending',
          signedAt: null,
          rejectedAt: null,
          employeeId: String(s.employeeId || '').slice(0, 64) || null,
          role: String(s.role || '').slice(0, 80),
          stationId: String(s.stationId || '').slice(0, 64) || null,
          signatureUrl: isAllowedDocUrl(s.signatureUrl) ? String(s.signatureUrl).slice(0, 2000) : '',
          stampTheme: allowedStampThemes.has(String(body.signatureTheme || '')) ? String(body.signatureTheme) : 'heritage',
          // Creator-assigned fields: one or more signatures plus optional text fields.
          spots: (Array.isArray(s.spots) && s.spots.length ? s.spots : s.spot ? [{ ...s.spot, type: 'signature' }] : [{ id: 'auto-signature', type: 'signature', page: 1, x: 75, y: 88, scale: 100 }]).slice(0, 30).map((field, fieldIndex) => ({
            id: String(field.id || `field-${fieldIndex}`).slice(0, 80),
            type: field.type === 'text' ? 'text' : 'signature',
            label: String(field.label || '').slice(0, 60),
            page: Math.max(1, Number(field.page) || 1),
            x: Math.min(100, Math.max(0, Number(field.x) || 0)),
            y: Math.min(100, Math.max(0, Number(field.y) || 0)),
            scale: Math.min(200, Math.max(50, Number(field.scale) || 100)),
          })),
          spot: null,
        }))
        .map((s) => ({ ...s, spot: s.spots.find((field) => field.type === 'signature') || null }))
        .filter((s, index, rows) => s.name && s.spot && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email) && rows.findIndex((row) => row.email === s.email) === index);
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
        signingMode: 'parallel',
        currentSignerIndex: 0,
        stationId: actor.stationId || null,
        appUrl: 'https://powercares.pro',
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        lastActivityAt: new Date().toISOString(),
        rejectionReason: null,
        signers,
        auditTrail: [{ type: 'created', at: new Date().toISOString(), actorId: actor.userId || null, actorName: actor.name, actorRole: actor.role || 'admin', location: { available: false } }],
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
      const links = Object.fromEntries(signers.map((s) => [s.email, `${appUrl}/sign?token=${rec.id}.${s.token}`]));
      const deliveryResults = await Promise.all(signers.map(async (signer, signerIndex) => {
        const link = links[signer.email];
        const turnText = ar
          ? `يمكنك مراجعة المستند "${rec.fileName}" وتوقيعه الآن بشكل مستقل عن بقية الموقّعين.`
          : `You can review and sign "${rec.fileName}" now, independently of the other signers.`;
        const ok = await sendMail(base44, signer.email, ar ? `طلب توقيع: ${rec.fileName}` : `Signature request: ${rec.fileName}`, ar ? `مرحبًا ${signer.name}،\n\n${turnText}\n${link}` : `Hello ${signer.name},\n\n${turnText}\n${link}`, signatureRequestEmail({ ar, signerName: signer.name, creatorName: rec.creatorName, fileName: rec.fileName, link, signerIndex, totalSigners: signers.length, expiresAt: rec.expiresAt }));
        return { email: signer.email, ok };
      }));
      const emailFailed = deliveryResults.filter((result) => !result.ok).map((result) => result.email);
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
            lastActivityAt: r.lastActivityAt || r.updated_date,
            docUrl: r.docUrl,
            stationId: r.stationId || null,
            currentSignerIndex: r.currentSignerIndex || 0,
            rejectionReason: r.rejectionReason || null,
            auditTrail: r.auditTrail || [],
            isCreator: r.creatorId === userId || (!!email && r.creatorEmail === email),
            myStatus: mySigner ? mySigner.status : null,
            myToken: mySigner ? `${r.id}.${mySigner.token}` : null,
            signers: (r.signers || []).map((s) => ({ name: s.name, email: s.email, role: s.role || '', stationId: s.stationId || null, status: s.status, signedAt: s.signedAt, rejectedAt: s.rejectedAt || null })),
          };
        });
      return Response.json({ requests: mine });
    }

    if (action === 'remind') {
      const { companyId, sessionToken } = body;
      const actor = await authSession(base44, companyId, sessionToken);
      if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const rec = await Docs.get(String(body.requestId || '')).catch(() => null);
      if (!rec || rec.companyId !== companyId) return Response.json({ error: 'Not found' }, { status: 404 });
      const actorId = String(actor.userId || (actor.admin ? body.userId : '') || '');
      const actorEmail = String(actor.email || '').toLowerCase();
      if (rec.creatorId !== actorId && (!actorEmail || rec.creatorEmail !== actorEmail)) return Response.json({ error: 'Only the creator can send reminders' }, { status: 403 });
      if (rec.status !== 'pending') return Response.json({ error: 'REQUEST_CLOSED' }, { status: 409 });
      const signerEmail = String(body.signerEmail || '').toLowerCase().trim();
      const signer = (rec.signers || []).find((item) => item.email === signerEmail && item.status === 'pending');
      if (!signer) return Response.json({ error: 'Pending signer not found' }, { status: 404 });
      const signerIndex = (rec.signers || []).findIndex((item) => item.token === signer.token);
      const link = `${rec.appUrl || 'https://powercares.pro'}/sign?token=${rec.id}.${signer.token}`;
      const ar = body.lang === 'ar';
      const sent = await sendMail(base44, signer.email, ar ? `تذكير بالتوقيع: ${rec.fileName}` : `Signing reminder: ${rec.fileName}`, ar ? `مرحبًا ${signer.name}،\n\nتذكير بوجود المستند "${rec.fileName}" بانتظار توقيعك.\n${link}` : `Hello ${signer.name},\n\nThis is a reminder that "${rec.fileName}" is waiting for your signature.\n${link}`, signatureRequestEmail({ ar, signerName: signer.name, creatorName: rec.creatorName, fileName: rec.fileName, link, signerIndex, totalSigners: (rec.signers || []).length, expiresAt: rec.expiresAt }));
      if (!sent) return Response.json({ error: 'Reminder email could not be delivered' }, { status: 502 });
      const remindedAt = new Date().toISOString();
      await Docs.update(rec.id, { lastActivityAt: remindedAt, auditTrail: [...(rec.auditTrail || []), { type: 'reminder_sent', at: remindedAt, actorId: actor.userId || null, actorName: actor.name, actorRole: actor.role || 'admin', targetName: signer.name, targetEmail: signer.email, location: { available: false } }] });
      return Response.json({ ok: true, signerEmail: signer.email });
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
        finalHash: rec.finalHash || null,
        signer: { name: signer.name, email: signer.email, status: signer.status, employeeId: signer.employeeId || null, role: signer.role || '', stationId: signer.stationId || null, signatureUrl: signer.signatureUrl || '', stampTheme: signer.stampTheme || 'heritage', spot: signer.spot || null, spots: signer.spots || (signer.spot ? [{ ...signer.spot, id: 'signature', type: 'signature', label: '' }] : []) },
        rejectionReason: rec.rejectionReason || null,
        signedCount: (rec.signers || []).filter((s) => s.status === 'signed').length,
        totalCount: (rec.signers || []).length,
        canSign: signer.status === 'signed' || (signer.status === 'pending' && (rec.status === 'pending' || (rec.status === 'rejected' && pending.length > 0))),
        isLast: signer.status === 'pending' && pending.length === 1,
        signerNames: (rec.signers || []).map((s) => s.name).join(', '),
      });
    }

    if (action === 'reject') {
      const found = await resolveToken(body.token);
      if (!found) return Response.json({ error: 'Invalid or expired signing link' }, { status: 404 });
      const { rec, signer, expired } = found;
      if (expired) return Response.json({ error: 'Invalid or expired signing link' }, { status: 404 });
      const pendingBeforeRejection = (rec.signers || []).filter((item) => item.status === 'pending');
      const requestAcceptsResponses = rec.status === 'pending' || (rec.status === 'rejected' && pendingBeforeRejection.length > 0);
      if (!requestAcceptsResponses || signer.status !== 'pending') return Response.json({ error: 'REQUEST_CLOSED' }, { status: 409 });
      const reason = String(body.reason || '').trim().slice(0, 1000);
      if (!reason) return Response.json({ error: 'Rejection reason is required' }, { status: 400 });
      const rejectedAt = new Date().toISOString();
      const location = cleanLocation(body.location);
      const signers = (rec.signers || []).map((item) => item.token === signer.token ? { ...item, status: 'rejected', rejectedAt, rejectionReason: reason, location } : item);
      const hasPendingSigners = signers.some((item) => item.status === 'pending');
      await Docs.update(rec.id, {
        signers,
        status: hasPendingSigners ? 'pending' : 'rejected',
        rejectionReason: reason,
        lastActivityAt: rejectedAt,
        auditTrail: [...(rec.auditTrail || []), { type: 'rejected', at: rejectedAt, actorId: signer.employeeId || null, actorName: signer.name, actorRole: signer.role || 'signer', location, reason }],
      });
      if (rec.creatorEmail) {
        const ar = body.lang === 'ar';
        await sendMail(base44, rec.creatorEmail, ar ? `رُفض المستند: ${rec.fileName}` : `Document rejected: ${rec.fileName}`, ar ? `رفض ${signer.name} المستند.\n\nالسبب: ${reason}` : `${signer.name} rejected the document.\n\nReason: ${reason}`);
      }
      return Response.json({ ok: true, reason });
    }

    if (action === 'submitSignature') {
      const found = await resolveToken(body.token);
      if (!found) return Response.json({ error: 'Invalid or expired signing link' }, { status: 404 });
      const { rec, signer, expired } = found;
      if (expired) return Response.json({ error: 'Invalid or expired signing link' }, { status: 404 });
      const pending = (rec.signers || []).filter((item) => item.status === 'pending');
      const requestAcceptsSignatures = rec.status === 'pending' || (rec.status === 'rejected' && pending.length > 0);
      if (!requestAcceptsSignatures || signer.status !== 'pending') return Response.json({ error: 'ALREADY_SIGNED' }, { status: 409 });
      const fileHash = String(body.fileHash || '').toLowerCase().slice(0, 64);
      if (!/^[0-9a-f]{64}$/.test(fileHash)) return Response.json({ error: 'Signed version fingerprint is required' }, { status: 400 });
      const newDocUrl = String(body.newDocUrl || '').slice(0, 2000);
      if (!isAllowedDocUrl(newDocUrl)) return Response.json({ error: 'A valid signed document URL is required' }, { status: 400 });
      const submittedValues = body.textValues && typeof body.textValues === 'object' ? body.textValues : {};
      const textFields = (signer.spots || []).filter((field) => field.type === 'text');
      const fieldValues = Object.fromEntries(textFields.map((field) => [field.id, String(submittedValues[field.id] || '').trim().slice(0, 1000)]));
      if (textFields.some((field) => !fieldValues[field.id])) return Response.json({ error: 'All text fields are required' }, { status: 400 });

      const signedAt = new Date().toISOString();
      const location = cleanLocation(body.location);
      const signers = (rec.signers || []).map((s) =>
        s.token === signer.token ? { ...s, status: 'signed', signedAt, fieldValues, documentHash: fileHash, location } : s
      );
      const completed = signers.every((s) => s.status === 'signed');
      const settled = signers.every((s) => s.status !== 'pending');
      const hasRejection = signers.some((s) => s.status === 'rejected');
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
          status: completed ? 'completed' : settled && hasRejection ? 'rejected' : 'pending',
          finalHash: completed ? fileHash : rec.finalHash,
          currentSignerIndex: signers.filter((item) => item.status === 'signed').length,
          lastActivityAt: signedAt,
          auditTrail: [...(rec.auditTrail || []), { type: 'signed', at: signedAt, actorId: signer.employeeId || null, actorName: signer.name, actorRole: signer.role || 'signer', location, documentHash: fileHash }],
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
        if (!notified) await sendMail(base44, rec.creatorEmail, subject, `${text}\n\n${newDocUrl}\n\n— NiroVera`);
      }
      return Response.json({ ok: true, completed, docUrl: newDocUrl, finalHash: completed ? fileHash : null });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('multiSign error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});