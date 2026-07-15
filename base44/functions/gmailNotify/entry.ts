import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { createMimeMessage } from 'npm:mimetext@3.0.24';

// Sends an email from the company's connected Gmail account.
// Authorized for the platform builder or any valid PowerCare company session.
function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Branded HTML wrapper — gold header, clean card, bilingual-friendly.
const EMAIL_LOGO = 'https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/df3e1cbab_generated_image.png';
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function emailHtml(title, text) {
  const paragraphs = escapeHtml(text).split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#4a3d2c;" dir="auto">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5efe4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe4;padding:32px 12px;"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eadfc9;">
      <tr><td style="background:linear-gradient(180deg,#d8b578,#b8863e);padding:26px;text-align:center;">
        <img src="${EMAIL_LOGO}" width="52" height="52" alt="PowerCare" style="display:block;margin:0 auto 8px;" />
        <div style="font-size:20px;font-weight:700;color:#ffffff;font-family:Georgia,serif;letter-spacing:1px;">PowerCare</div>
      </td></tr>
      <tr><td style="padding:30px 30px 10px;">
        <h1 style="margin:0 0 16px;font-size:18px;color:#3a2f22;font-family:Georgia,serif;" dir="auto">${escapeHtml(title)}</h1>
        ${paragraphs}
      </td></tr>
      <tr><td style="padding:18px 30px 26px;border-top:1px solid #f0e8d8;">
        <p style="margin:0;font-size:12px;color:#a08c6a;text-align:center;" dir="auto">PowerCare — إدارة ذكية لفريقك ومهامك · Smart workforce management</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { companyId, sessionToken, to, subject, text } = body;
    if (!companyId || !to || !subject || !text) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Authorization: platform admin OR a valid company session token issued at login.
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      if (!companyId || !sessionToken) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: sessionToken, companyId });
      const s = sessions[0];
      if (!s || new Date(s.expiresAt).getTime() < Date.now()) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // The shared company mailbox may only send to employees registered in this company.
    const employees = await base44.asServiceRole.entities.Employee.filter({ companyId });
    const recipient = employees.find((employee) => String(employee.email || '').toLowerCase() === String(to).toLowerCase());
    if (!recipient) return Response.json({ error: 'Recipient must be a company employee' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const msg = createMimeMessage();
    // Gmail rewrites the From header to the authenticated account automatically.
    msg.setSender({ name: 'PowerCare', addr: 'no-reply@powercare.app' });
    msg.setRecipient(to);
    msg.setSubject(subject);
    msg.addMessage({ contentType: 'text/html', data: emailHtml(subject, text) });

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: toBase64Url(msg.asRaw()) }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Gmail send failed:', JSON.stringify(data));
      return Response.json({ error: data?.error?.message || 'Send failed' }, { status: res.status });
    }
    return Response.json({ ok: true, id: data.id });
  } catch (error) {
    console.error('gmailNotify error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});