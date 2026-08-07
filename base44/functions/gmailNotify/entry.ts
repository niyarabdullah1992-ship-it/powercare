import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { createMimeMessage } from 'npm:mimetext@3.0.24';
import { fetchWithRetry } from '../../shared/fetchRetry.ts';
import { POWERCARE_LOGO_URL } from '../../shared/brand.ts';

// Sends an email from the company's connected Gmail account.
// Authorized for the platform builder or any valid PowerCare company session.
function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Branded HTML wrapper — gold header, clean card, bilingual-friendly.
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const isAllowedCtaUrl = (value) => {
  try {
    const raw = String(value || '');
    if (!raw || raw.length > 2000) return false;
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const trustedHost = host === 'powercares.pro' || host.endsWith('.powercares.pro') || host === 'base44.app' || host.endsWith('.base44.app') || host === 'media.base44.com';
    return url.protocol === 'https:' && trustedHost && (url.port === '' || url.port === '443') && url.username === '' && url.password === '';
  } catch {
    return false;
  }
};
function emailHtml(title, text, details, cta) {
  const paragraphs = escapeHtml(text).split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#52606d;" dir="auto">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
  // Optional structured details table — [{label, value}]
  const detailsRows = Array.isArray(details) && details.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 16px;border:1px solid #d9cfbb;border-radius:10px;background:#fbf9f4;">
        ${details.map((d, i) => `<tr>
          <td dir="auto" style="padding:10px 14px;font-size:12px;color:#77818b;white-space:nowrap;${i ? 'border-top:1px solid #e6dece;' : ''}">${escapeHtml(d.label)}</td>
          <td dir="auto" style="padding:10px 14px;font-size:13px;font-weight:700;color:#13283d;text-align:end;${i ? 'border-top:1px solid #e6dece;' : ''}">${escapeHtml(d.value)}</td>
        </tr>`).join('')}
      </table>`
    : '';
  // Optional call-to-action button — {label, url}
  const ctaBtn = cta?.url
    ? `<div style="text-align:center;margin:8px 0 18px;">
        <a href="${escapeHtml(cta.url)}" style="display:inline-block;background:linear-gradient(180deg,#d6c28f,#9e7c47);color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 34px;border-radius:999px;">${escapeHtml(cta.label || 'PowerCare')}</a>
      </div>`
    : '';
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f7f4ed;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ed;padding:32px 12px;"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d9cfbb;">
      <tr><td style="background:linear-gradient(180deg,#d6c28f,#9e7c47);padding:26px;text-align:center;">
        <img src="${POWERCARE_LOGO_URL}" width="72" height="72" alt="PowerCare" style="display:block;margin:0 auto 8px;" />
        <div style="font-size:20px;font-weight:700;color:#ffffff;font-family:Georgia,serif;letter-spacing:1px;">PowerCare</div>
      </td></tr>
      <tr><td style="padding:30px 30px 10px;">
        <h1 style="margin:0 0 16px;font-size:18px;color:#13283d;font-family:Georgia,serif;" dir="auto">${escapeHtml(title)}</h1>
        ${paragraphs}
        ${detailsRows}
        ${ctaBtn}
      </td></tr>
      <tr><td style="padding:18px 30px 26px;border-top:1px solid #e6dece;">
        <p style="margin:0;font-size:12px;color:#77818b;text-align:center;" dir="auto">PowerCare — إدارة ذكية لفريقك ومهامك · Smart workforce management</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { companyId, sessionToken } = body;
    const isProductFeedback = body.kind === 'product_feedback';
    const isAssistantEmail = body.kind === 'assistant_email';
    let to = String(body.to || '').trim();
    let subject = String(body.subject || '');
    let text = String(body.text || '');
    let details = body.details;
    let cta = body.cta;
    let feedbackRecord = null;
    if (!companyId || (!isProductFeedback && (!to || !subject || !text))) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Authorization: platform admin OR a valid company session token issued at login.
    const user = await base44.auth.me().catch(() => null);
    let senderRole = user?.role === 'admin' ? 'admin' : null;
    if (!senderRole) {
      if (!companyId || !sessionToken) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: sessionToken, companyId });
      const s = sessions[0];
      if (!s || new Date(s.expiresAt).getTime() < Date.now()) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (s.role === 'owner') senderRole = 'owner';
      else if (s.userId) {
        const employees = await base44.asServiceRole.entities.Employee.filter({ companyId, employeeId: s.userId });
        senderRole = employees[0]?.role || null;
      }
    }

    if (isProductFeedback) {
      const rating = Number(body.rating);
      const message = String(body.message || '').trim().slice(0, 1000);
      const page = String(body.page || '').slice(0, 300);
      const role = String(body.role || '').slice(0, 80);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !message) {
        return Response.json({ error: 'A rating and suggestion are required' }, { status: 400 });
      }
      feedbackRecord = await base44.asServiceRole.entities.ProductFeedback.create({ companyId, role, rating, message, page });
      to = 'niyar@powercares.pro';
      subject = `PowerCare feedback — ${rating}/5`;
      text = message;
      details = [
        { label: 'Rating', value: `${rating}/5` },
        { label: 'Company', value: String(companyId) },
        { label: 'Role', value: role || 'User' },
        { label: 'Page', value: page || '—' },
      ];
      cta = null;
    } else if (isAssistantEmail) {
      const allowedRoles = ['admin', 'owner', 'director', 'ops_manager', 'pgm', 'station_manager'];
      if (!allowedRoles.includes(senderRole || '')) return Response.json({ error: 'Email sending permission required' }, { status: 403 });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || subject.length > 200 || text.length > 10000) {
        return Response.json({ error: 'Valid recipient, subject and message are required' }, { status: 400 });
      }
      const employees = await base44.asServiceRole.entities.Employee.filter({ companyId });
      const recipient = employees.find((employee) => String(employee.email || '').trim().toLowerCase() === to.toLowerCase());
      if (!recipient) return Response.json({ error: 'Recipient must be a company employee' }, { status: 403 });
      if (cta?.url && !isAllowedCtaUrl(cta.url)) return Response.json({ error: 'Call-to-action URL is not allowed' }, { status: 400 });
    } else {
      // Existing automated alerts remain restricted to registered company employees.
      const employees = await base44.asServiceRole.entities.Employee.filter({ companyId });
      const recipient = employees.find((employee) => String(employee.email || '').toLowerCase() === String(to).toLowerCase());
      if (!recipient) return Response.json({ error: 'Recipient must be a company employee' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
    const profile = profileRes.ok ? await profileRes.json() : null;
    if (!profile?.email) return Response.json({ error: 'Connected Gmail sender identity is unavailable' }, { status: 502 });
    const msg = createMimeMessage();
    msg.setSender({ name: 'PowerCare', addr: profile.email });
    msg.setRecipient(to);
    msg.setSubject(subject);
    msg.addMessage({ contentType: 'text/html', data: emailHtml(subject, text, details, cta) });

    const res = await fetchWithRetry('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: toBase64Url(msg.asRaw()) }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Gmail send failed:', JSON.stringify(data));
      return Response.json({ error: data?.error?.message || 'Send failed' }, { status: res.status });
    }
    return Response.json({ ok: true, id: data.id, feedbackId: feedbackRecord?.id || null });
  } catch (error) {
    console.error('gmailNotify error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});