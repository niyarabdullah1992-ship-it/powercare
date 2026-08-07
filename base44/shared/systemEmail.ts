// Branded system email via the connected Gmail account (falls back to Core.SendEmail).
import { createMimeMessage } from 'npm:mimetext@3.0.24';

const EMAIL_LOGO = 'https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/1914d20bd_.png';
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function brandedEmailHtml({ title, lines = [], linkUrl = null, linkLabel = '', footerNote = '' }) {
  const paragraphs = lines.map((line) => `<p style="margin:0 auto 20px;max-width:520px;font-size:19px;line-height:1.55;color:#17202b;text-align:center;" dir="auto">${escapeHtml(line)}</p>`).join('');
  const button = linkUrl
    ? `<div style="margin:26px 0;text-align:center;"><a href="${escapeHtml(linkUrl)}" style="display:inline-block;padding:15px 34px;border-radius:6px;background:#107949;color:#ffffff;font-size:19px;font-weight:600;text-decoration:none;" dir="auto">${escapeHtml(linkLabel || linkUrl)}</a></div>`
    : '';
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f3f8;"><tr><td align="center" style="padding:56px 18px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #d8dde5;border-radius:8px;overflow:hidden;">
      <tr><td align="center" style="background:#14274F;padding:26px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;"><img src="${EMAIL_LOGO}" width="40" height="40" alt="PowerCare" style="display:block;width:40px;height:40px;object-fit:contain;border:0;" /></td>
          <td style="font-size:27px;line-height:40px;font-weight:600;color:#ffffff;">PowerCare</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:42px 30px 36px;text-align:center;">
        <h1 style="margin:0 0 18px;font-size:32px;line-height:1.25;color:#101820;font-weight:700;text-align:center;" dir="auto">${escapeHtml(title)}</h1>
        ${paragraphs}${button}
        <p style="margin:0 auto;max-width:540px;font-size:16px;line-height:1.55;color:#28313b;text-align:center;" dir="auto">${escapeHtml(footerNote || 'PowerCare — إدارة ذكية لفريقك ومهامك')}</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export async function sendSystemEmail(base44, { to, subject, body, html }) {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
    const profile = profileRes.ok ? await profileRes.json() : null;
    if (!profile?.email) throw new Error('Connected Gmail sender identity is unavailable');
    const msg = createMimeMessage();
    msg.setSender({ name: 'PowerCare', addr: profile.email });
    msg.setRecipient(to);
    msg.setSubject(subject);
    if (html) msg.addMessage({ contentType: 'text/html', data: html });
    else msg.addMessage({ contentType: 'text/plain', data: body });
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: toBase64Url(msg.asRaw()) }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error?.message || `Gmail send failed (${res.status})`);
    }
  } catch (gmailError) {
    console.error('Gmail system email failed, falling back to Core.SendEmail:', gmailError.message);
    await base44.asServiceRole.integrations.Core.SendEmail({ to, from_name: 'PowerCare', subject, body });
  }
}