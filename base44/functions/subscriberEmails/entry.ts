import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createMimeMessage } from 'npm:mimetext@3.0.24';

// Branded HTML wrapper — gold header, clean card, bilingual-friendly.
const EMAIL_LOGO = 'https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/df3e1cbab_generated_image.png';
function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
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

// Subscriber email hub for PowerCare:
// - welcome:            sent when a new company account is created
// - paymentConfirmed:   sent after a successful Stripe checkout
// - trialReminderSweep: daily sweep (workflow) — reminds paid accounts 3 days before the 4-month (120-day) trial ends
// - broadcast:          platform-owner only — sends site news to every subscriber email
const TRIAL_DAYS = 120;
const REMIND_AT_DAY = 117; // 3 days before trial end

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    // Sends a branded HTML email via the connected Gmail account, falling back to
    // the built-in email service (plain text) if Gmail is unavailable.
    const send = async (to, subject, emailBody) => {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
        const msg = createMimeMessage();
        msg.setSender({ name: 'PowerCare', addr: 'no-reply@powercare.app' });
        msg.setRecipient(to);
        msg.setSubject(subject);
        msg.addMessage({ contentType: 'text/html', data: emailHtml(subject, emailBody) });
        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: toBase64Url(msg.asRaw()) }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error?.message || `Gmail send failed (${res.status})`);
        }
        return;
      } catch (gmailError) {
        console.error('Gmail send failed, falling back to Core.SendEmail:', gmailError.message);
        await base44.asServiceRole.integrations.Core.SendEmail({
          to, subject, body: emailBody, from_name: 'PowerCare',
        });
      }
    };

    if (action === 'welcome' || action === 'paymentConfirmed') {
      // Not public: requires a valid session for the company, and the recipient +
      // company name + plan are read from the server-stored account record —
      // never from the request body (blocks spoofed/phishing content injection).
      const { companyId, sessionToken } = body;
      const user = await base44.auth.me().catch(() => null);
      let authed = !!(user && user.role === 'admin');
      if (!authed && companyId && sessionToken) {
        const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: sessionToken, companyId });
        const s = sessions[0];
        authed = !!(s && new Date(s.expiresAt).getTime() > Date.now());
      }
      if (!authed) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const accounts = await base44.asServiceRole.entities.CompanyAccount.filter({ companyId });
      const acc = accounts[0];
      if (!acc?.ownerEmail) return Response.json({ error: 'Account not found' }, { status: 404 });
      const companyName = String(acc.name || '').replace(/[\r\n]/g, ' ').slice(0, 120);
      if (action === 'welcome') {
        await send(
          acc.ownerEmail,
          `Welcome to PowerCare${companyName ? ` — ${companyName}` : ''}`,
          `Hello,\n\nYour PowerCare account${companyName ? ` for "${companyName}"` : ''} has been created successfully.\n\nYou can now sign in with this email address, add your stations and team, and start managing your operations from one place.\n\nIf you have any questions, just reply to this email.\n\n— The PowerCare Team`
        );
      } else {
        const plan = String(acc.plan || '').replace(/[\r\n]/g, ' ').slice(0, 40);
        await send(
          acc.ownerEmail,
          `Your PowerCare ${plan} subscription is confirmed`,
          `Hello,\n\nThank you for subscribing to PowerCare${plan ? ` (${plan} plan)` : ''}${companyName ? ` for "${companyName}"` : ''}.\n\nYour ${TRIAL_DAYS}-day free trial starts today — you won't be charged until it ends, and you can cancel anytime before then.\n\nEnjoy the platform!\n\n— The PowerCare Team`
        );
      }
      return Response.json({ ok: true });
    }

    // Admin-only actions below (platform owner or scheduled workflow).
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'trialReminderSweep') {
      const accounts = await base44.asServiceRole.entities.CompanyAccount.list('-created_date', 1000);
      const now = Date.now();
      let sent = 0;
      for (const acc of accounts) {
        const plan = String(acc.plan || '').toLowerCase();
        if (!plan || plan === 'free') continue;
        if (acc.trialReminderSent) continue;
        const ageDays = (now - new Date(acc.created_date).getTime()) / 86400000;
        if (ageDays < REMIND_AT_DAY || ageDays >= TRIAL_DAYS) continue;
        const daysLeft = Math.max(1, Math.ceil(TRIAL_DAYS - ageDays));
        try {
          await send(
            acc.ownerEmail,
            `Your PowerCare free trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
            `Hello,\n\nJust a heads-up: the ${TRIAL_DAYS}-day free trial for "${acc.name || 'your company'}" (${acc.plan} plan) ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.\n\nAfter that, your subscription billing will begin automatically. If you'd like to change or cancel your plan, you can do so anytime before the trial ends.\n\n— The PowerCare Team`
          );
          await base44.asServiceRole.entities.CompanyAccount.update(acc.id, { trialReminderSent: true });
          sent++;
        } catch (e) {
          console.error('trial reminder failed for', acc.ownerEmail, e.message);
        }
      }
      return Response.json({ ok: true, sent });
    }

    if (action === 'broadcast') {
      const { subject, message } = body;
      if (!subject || !message) return Response.json({ error: 'Missing subject or message' }, { status: 400 });
      const accounts = await base44.asServiceRole.entities.CompanyAccount.list('-created_date', 1000);
      const emails = [...new Set(accounts.map((a) => String(a.ownerEmail || '').toLowerCase()).filter(Boolean))];
      let sent = 0;
      for (const email of emails) {
        try {
          await send(email, subject, `${message}\n\n— The PowerCare Team`);
          sent++;
        } catch (e) {
          console.error('broadcast failed for', email, e.message);
        }
      }
      return Response.json({ ok: true, sent, total: emails.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('subscriberEmails error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});