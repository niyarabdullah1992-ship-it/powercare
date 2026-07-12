import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    const send = async (to, subject, emailBody) => {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to, subject, body: emailBody, from_name: 'PowerCare',
      });
    };

    if (action === 'welcome') {
      const { email, companyName } = body;
      if (!email) return Response.json({ error: 'Missing email' }, { status: 400 });
      await send(
        email,
        `Welcome to PowerCare${companyName ? ` — ${companyName}` : ''}`,
        `Hello,\n\nYour PowerCare account${companyName ? ` for "${companyName}"` : ''} has been created successfully.\n\nYou can now sign in with this email address, add your stations and team, and start managing your operations from one place.\n\nIf you have any questions, just reply to this email.\n\n— The PowerCare Team`
      );
      return Response.json({ ok: true });
    }

    if (action === 'paymentConfirmed') {
      const { email, companyName, plan } = body;
      if (!email) return Response.json({ error: 'Missing email' }, { status: 400 });
      await send(
        email,
        `Your PowerCare ${plan || ''} subscription is confirmed`,
        `Hello,\n\nThank you for subscribing to PowerCare${plan ? ` (${plan} plan)` : ''}${companyName ? ` for "${companyName}"` : ''}.\n\nYour ${TRIAL_DAYS}-day free trial starts today — you won't be charged until it ends, and you can cancel anytime before then.\n\nEnjoy the platform!\n\n— The PowerCare Team`
      );
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