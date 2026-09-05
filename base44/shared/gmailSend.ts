import { createMimeMessage } from 'npm:mimetext@3.0.24';
import { POWERCARE_LOGO_URL, BRAND_NAME, BRAND_NAVY, BRAND_NAVY_DEEP, BRAND_GREEN, BRAND_BG, BRAND_BORDER, BRAND_MUTED } from './brand.ts';

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
    ? `<div style="text-align:center;margin:8px 0 18px;"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:${BRAND_GREEN};color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 34px;border-radius:10px;">${escapeHtml(cta.label)}</a></div>`
    : '';
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:${BRAND_BG};font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};padding:32px 12px;"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid ${BRAND_BORDER};">
      <tr><td style="background:${BRAND_NAVY};padding:26px;text-align:center;border-bottom:3px solid ${BRAND_GREEN};">
        <img src="${POWERCARE_LOGO_URL}" width="72" height="72" alt="${BRAND_NAME}" style="display:block;margin:0 auto 8px;" />
        <div style="font-size:20px;font-weight:700;color:#fff;letter-spacing:1px;">${BRAND_NAME}</div>
      </td></tr>
      <tr><td style="padding:30px 30px 10px;">
        <h1 style="margin:0 0 16px;font-size:18px;color:${BRAND_NAVY};" dir="auto">${escapeHtml(title)}</h1>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.9;color:${BRAND_MUTED};" dir="auto">${escapeHtml(text).replace(/\n/g, '<br/>')}</p>
        ${ctaBtn}
      </td></tr>
      <tr><td style="padding:18px 30px 26px;border-top:1px solid ${BRAND_BORDER};">
        <p style="margin:0;font-size:12px;color:${BRAND_MUTED};text-align:center;" dir="auto">${BRAND_NAME} — منصة العمليات المؤسسية · Enterprise operations</p>
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
  msg.setSender({ name: BRAND_NAME, addr: profile.email });
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