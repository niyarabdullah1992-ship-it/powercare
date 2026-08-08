import { createMimeMessage } from 'npm:mimetext@3.0.24';
import { POWERCARE_LOGO_URL } from './brand.ts';

function toBase64Url(str: string) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function escapeHtml(s: unknown) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function html(title: string, text: string, cta?: { url: string; label: string }) {
  const ctaBtn = cta?.url
    ? `<div style="text-align:center;margin:8px 0 18px;"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:linear-gradient(180deg,#d6c28f,#9e7c47);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 34px;border-radius:999px;">${escapeHtml(cta.label)}</a></div>`
    : '';
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f7f4ed;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ed;padding:32px 12px;"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #d9cfbb;">
      <tr><td style="background:linear-gradient(180deg,#d6c28f,#9e7c47);padding:26px;text-align:center;">
        <img src="${POWERCARE_LOGO_URL}" width="72" height="72" alt="PowerCare" style="display:block;margin:0 auto 8px;" />
        <div style="font-size:20px;font-weight:700;color:#fff;font-family:Georgia,serif;letter-spacing:1px;">PowerCare</div>
      </td></tr>
      <tr><td style="padding:30px 30px 10px;">
        <h1 style="margin:0 0 16px;font-size:18px;color:#13283d;font-family:Georgia,serif;" dir="auto">${escapeHtml(title)}</h1>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.9;color:#52606d;" dir="auto">${escapeHtml(text).replace(/\n/g, '<br/>')}</p>
        ${ctaBtn}
      </td></tr>
      <tr><td style="padding:18px 30px 26px;border-top:1px solid #e6dece;">
        <p style="margin:0;font-size:12px;color:#77818b;text-align:center;" dir="auto">PowerCare — إثبات العمل للعميل · Client work proof</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

// Sends a branded email from the company's connected Gmail account.
export async function sendGmail(base44: any, { to, subject, text, cta }: { to: string; subject: string; text: string; cta?: { url: string; label: string } }) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
  const profile = profileRes.ok ? await profileRes.json() : null;
  if (!profile?.email) throw new Error('Connected Gmail sender identity is unavailable');
  const msg = createMimeMessage();
  msg.setSender({ name: 'PowerCare', addr: profile.email });
  msg.setRecipient(to);
  msg.setSubject(subject);
  msg.addMessage({ contentType: 'text/html', data: html(subject, text, cta) });
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: toBase64Url(msg.asRaw()) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Send failed');
  return data;
}