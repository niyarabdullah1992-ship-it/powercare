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
    msg.addMessage({ contentType: 'text/plain', data: text });

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