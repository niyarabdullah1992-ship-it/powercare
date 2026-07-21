import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@17.4.0';

// Maps Stripe price ids back to plan names (must mirror stripeCheckout).
const PRICE_TO_PLAN = {
  'price_1Tro3sAz7ujPvPWo7k0AlkdX': { plan: 'Starter', billing: 'monthly' },
  'price_1Tro3sAz7ujPvPWoIBbqHn9U': { plan: 'Professional', billing: 'monthly' },
  'price_1Tro3sAz7ujPvPWotQRKoAwm': { plan: 'Enterprise', billing: 'monthly' },
  'price_1TsHYVAz7ujPvPWoBYJSnewC': { plan: 'Starter', billing: 'yearly' },
  'price_1TsHYVAz7ujPvPWoDT5T2QpW': { plan: 'Professional', billing: 'yearly' },
  'price_1TsHYVAz7ujPvPWofmRS51uY': { plan: 'Enterprise', billing: 'yearly' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });

    // Optional admin actions (POST body with { action, ... }); no action → overview.
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty body → overview */ }

    const action = String(body.action || '');
    const auditAction = async (account, key, oldValue, newValue, reason = '') => {
      await base44.asServiceRole.entities.AuditLog.create({
        companyId: account?.companyId || 'platform', action: key, performedBy: user.email || user.full_name || 'Platform owner',
        details: `${account?.name || 'Company'}: ${oldValue || '—'} → ${newValue || '—'}`,
        reason: String(reason || '').slice(0, 1000) || null, oldValue: String(oldValue ?? ''), newValue: String(newValue ?? ''),
      });
    };
    const getAccount = async () => body.accountId ? await base44.asServiceRole.entities.CompanyAccount.get(String(body.accountId)).catch(() => null) : null;

    if (['freeze', 'unfreeze', 'extend', 'changePlan', 'updateAccount'].includes(action)) {
      const account = await getAccount();
      if (!account) return Response.json({ error: 'Company account not found' }, { status: 404 });
      if (action === 'freeze') {
        const reason = String(body.reason || '').trim();
        if (!reason) return Response.json({ error: 'Freeze reason is required' }, { status: 400 });
        await base44.asServiceRole.entities.CompanyAccount.update(account.id, { frozen: true, frozenAt: new Date().toISOString(), frozenReason: reason });
        await auditAction(account, 'subscription_frozen', account.frozen ? 'frozen' : 'active', 'frozen', reason);
      } else if (action === 'unfreeze') {
        await base44.asServiceRole.entities.CompanyAccount.update(account.id, { frozen: false, frozenAt: null, frozenReason: null });
        await auditAction(account, 'subscription_unfrozen', 'frozen', 'active', body.reason);
      } else {
        const validPlans = new Set(['Starter', 'Professional', 'Enterprise', 'Custom']);
        if ((action === 'changePlan' || action === 'updateAccount') && body.plan !== undefined) {
          if (!validPlans.has(String(body.plan))) return Response.json({ error: 'Invalid plan' }, { status: 400 });
          const customPrice = body.plan === 'Custom' ? Math.max(0, Number(body.customPrice) || 0) : null;
          await base44.asServiceRole.entities.CompanyAccount.update(account.id, { plan: body.plan, customPrice });
          if (account.plan !== body.plan || account.customPrice !== customPrice) await auditAction(account, 'subscription_plan_changed', `${account.plan || '—'}${account.customPrice != null ? ` ($${account.customPrice})` : ''}`, `${body.plan}${customPrice != null ? ` ($${customPrice})` : ''}`, body.reason);
        }
        if ((action === 'extend' || action === 'updateAccount') && body.subscriptionEnd !== undefined) {
          const nextEnd = body.subscriptionEnd || null;
          await base44.asServiceRole.entities.CompanyAccount.update(account.id, { subscriptionStart: body.subscriptionStart || account.subscriptionStart || null, subscriptionEnd: nextEnd });
          if (account.subscriptionEnd !== nextEnd) await auditAction(account, 'subscription_extended', account.subscriptionEnd || '—', nextEnd || '—', body.reason);
        }
      }
      return Response.json({ ok: true });
    }

    if (['cancelAtPeriodEnd', 'reactivate', 'cancelNow'].includes(action)) {
      const account = await getAccount();
      if (action === 'cancelAtPeriodEnd') {
        await stripe.subscriptions.update(String(body.subscriptionId), { cancel_at_period_end: true });
        await auditAction(account, 'subscription_cancel_scheduled', 'active', 'cancel at period end', body.reason);
      } else if (action === 'reactivate') {
        await stripe.subscriptions.update(String(body.subscriptionId), { cancel_at_period_end: false });
        await auditAction(account, 'subscription_reactivated', 'cancel at period end', 'active', body.reason);
      } else {
        await stripe.subscriptions.cancel(String(body.subscriptionId));
        await auditAction(account, 'subscription_canceled', 'active', 'canceled immediately', body.reason);
      }
      return Response.json({ ok: true });
    }

    if (action === 'platformReport') {
      const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
      const cutoff30 = Date.now() - 30 * 86400000;
      const [accountRows, employees, blobs, sessions, signatures, inventory, movements, feedback] = await Promise.all([
        base44.asServiceRole.entities.CompanyAccount.list('-created_date', 500),
        base44.asServiceRole.entities.Employee.list('-created_date', 500),
        base44.asServiceRole.entities.CompanyDataBlob.list('-updated_date', 500),
        base44.asServiceRole.entities.CompanySession.list('-created_date', 500),
        base44.asServiceRole.entities.SignatureRequest.list('-created_date', 500),
        base44.asServiceRole.entities.InventoryItem.list('-created_date', 500),
        base44.asServiceRole.entities.StockMovement.list('-created_date', 500),
        base44.asServiceRole.entities.ProductFeedback.list('-created_date', 500),
      ]);
      const valueDate = (item) => new Date(item.completedAt || item.completed_date || item.updatedAt || item.updated_date || item.createdAt || item.created_date || 0).getTime();
      const companies = accountRows.filter((account) => !(account.ownerEmail || '').endsWith('@powercare-demo.com')).map((account) => {
        const companyBlobs = blobs.filter((blob) => blob.companyId === account.companyId);
        const tasks = companyBlobs.find((blob) => blob.category === 'tasks')?.payload || [];
        const attendance = companyBlobs.find((blob) => blob.category === 'personalAttendance')?.payload || [];
        const present = attendance.filter((record) => record.checkIn || record.status === 'present' || record.status === 'checked_in' || record.status === 'completed').length;
        const companyFeedback = feedback.filter((item) => item.companyId === account.companyId);
        return {
          companyId: account.companyId, companyName: account.name || account.ownerEmail, plan: account.plan || '—',
          employees: employees.filter((item) => item.companyId === account.companyId).length,
          completedTasks: tasks.filter((task) => ['done', 'completed', 'approved'].includes(String(task.status || '').toLowerCase()) && valueDate(task) >= monthStart.getTime()).length,
          attendanceRate: attendance.length ? Math.round((present / attendance.length) * 100) : 0,
          loginSessions: sessions.filter((item) => item.companyId === account.companyId && new Date(item.created_date || 0).getTime() >= cutoff30).length,
          signedDocuments: signatures.filter((item) => item.companyId === account.companyId && item.status === 'completed').length,
          inventoryItems: inventory.filter((item) => item.companyId === account.companyId && item.archived !== true).length,
          stockMovements: movements.filter((item) => item.companyId === account.companyId).length,
          feedbackCount: companyFeedback.length,
          averageRating: companyFeedback.length ? Math.round(companyFeedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) / companyFeedback.length * 10) / 10 : null,
        };
      });
      return Response.json({ companies });
    }

    // Registered companies (to match subscriptions to company names).
    const allAccounts = await base44.asServiceRole.entities.CompanyAccount.list('-created_date', 500);
    // Preview/demo companies are excluded from the subscriptions view.
    const accounts = allAccounts.filter((a) => !(a.ownerEmail || '').endsWith('@powercare-demo.com'));
    const byEmail = {};
    for (const a of accounts) {
      const key = (a.ownerEmail || '').toLowerCase();
      if (key && !byEmail[key]) byEmail[key] = a;
    }

    // All Stripe subscriptions (paginated).
    const subs = [];
    let startingAfter;
    while (true) {
      const page = await stripe.subscriptions.list({
        status: 'all',
        limit: 100,
        expand: ['data.customer'],
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      subs.push(...page.data);
      if (!page.has_more) break;
      startingAfter = page.data[page.data.length - 1].id;
    }

    const now = Date.now();
    const rows = subs.map((s) => {
      const priceId = s.items?.data?.[0]?.price?.id;
      const priceInfo = PRICE_TO_PLAN[priceId] || {};
      const email = (typeof s.customer === 'object' ? s.customer?.email : '') || '';
      const account = byEmail[email.toLowerCase()];
      const endTs = (s.trial_end && s.status === 'trialing' ? s.trial_end : s.current_period_end) * 1000;
      return {
        id: s.id,
        accountId: account?.id || null,
        companyName: account?.name || s.metadata?.companyName || '',
        email,
        plan: account?.plan || priceInfo.plan || '—',
        billing: priceInfo.billing || '',
        status: s.status, // trialing | active | past_due | canceled | unpaid | incomplete
        cancelAtPeriodEnd: !!s.cancel_at_period_end,
        startedAt: s.start_date ? s.start_date * 1000 : null,
        endsAt: endTs || null,
        daysLeft: endTs ? Math.ceil((endTs - now) / 86400000) : null,
        amount: s.items?.data?.[0]?.price?.unit_amount != null ? s.items.data[0].price.unit_amount / 100 : null,
        currency: (s.items?.data?.[0]?.price?.currency || 'usd').toUpperCase(),
        frozen: account?.frozen === true,
        frozenAt: account?.frozenAt || null,
        frozenReason: account?.frozenReason || null,
      };
    });

    // Companies registered without any Stripe subscription (free/manual).
    const subEmails = new Set(rows.map((r) => r.email.toLowerCase()).filter(Boolean));
    const noSub = accounts
      .filter((a) => a.ownerEmail && !subEmails.has(a.ownerEmail.toLowerCase()))
      .map((a) => {
        const startTs = a.subscriptionStart ? Date.parse(a.subscriptionStart) : null;
        const endTs = a.subscriptionEnd ? Date.parse(a.subscriptionEnd) : null;
        // A manually-managed subscription (e.g. Custom plan) with a future end date counts as active.
        const manualActive = !!endTs && endTs > now && (a.plan || 'Free') !== 'Free';
        return {
          accountId: a.id,
          companyName: a.name || '',
          email: a.ownerEmail,
          plan: a.plan || 'Free',
          status: manualActive ? 'manual_active' : 'no_subscription',
          startedAt: startTs,
          endsAt: endTs,
          daysLeft: endTs ? Math.ceil((endTs - now) / 86400000) : null,
          amount: a.customPrice ?? null,
          customPrice: a.customPrice ?? null,
          frozen: a.frozen === true,
          frozenAt: a.frozenAt || null,
          frozenReason: a.frozenReason || null,
        };
      });

    const active = rows.filter((r) => r.status === 'active' || r.status === 'trialing');
    const summary = {
      totalCompanies: accounts.length,
      activeSubscriptions: active.length + noSub.filter((r) => r.status === 'manual_active').length,
      trialing: rows.filter((r) => r.status === 'trialing').length,
      pastDue: rows.filter((r) => r.status === 'past_due' || r.status === 'unpaid').length,
      canceled: rows.filter((r) => r.status === 'canceled').length,
      frozen: accounts.filter((account) => account.frozen === true).length,
      expired: [...rows, ...noSub].filter((r) => r.endsAt && r.endsAt < now && !['active', 'trialing', 'manual_active'].includes(r.status)).length,
      endingSoon: active.filter((r) => r.daysLeft != null && r.daysLeft <= 14 && (r.cancelAtPeriodEnd || r.status === 'trialing')).length,
      byPlan: {
        Free: accounts.filter((a) => !a.plan || a.plan === 'Free').length,
        Starter: active.filter((r) => r.plan === 'Starter').length,
        Professional: active.filter((r) => r.plan === 'Professional').length,
        Enterprise: active.filter((r) => r.plan === 'Enterprise').length,
        Custom: noSub.filter((r) => r.plan === 'Custom' && r.status === 'manual_active').length,
      },
    };

    // Monthly recurring revenue from active/trialing subscriptions + manually-managed custom plans.
    const manualMrr = noSub.filter((r) => r.status === 'manual_active').reduce((sum, r) => sum + (r.customPrice || 0), 0);
    summary.mrr = Math.round((active.reduce((sum, r) => sum + (r.amount ? (r.billing === 'yearly' ? r.amount / 12 : r.amount) : 0), 0) + manualMrr) * 100) / 100;
    summary.arr = Math.round(summary.mrr * 12 * 100) / 100;
    summary.manualActive = noSub.filter((r) => r.status === 'manual_active').length;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const [todaySessions, latestFeedback] = await Promise.all([
      base44.asServiceRole.entities.CompanySession.list('-lastSeenAt', 500),
      base44.asServiceRole.entities.ProductFeedback.list('-created_date', 5),
    ]);
    summary.activeUsersToday = new Set(todaySessions.filter((session) => new Date(session.lastSeenAt || 0).getTime() >= todayStart.getTime()).map((session) => `${session.companyId}:${session.userId || 'owner'}`)).size;

    // Company signups per month (growth chart).
    const growthMap: Record<string, number> = {};
    for (const a of accounts) {
      const m = (a.created_date || '').slice(0, 7);
      if (m) growthMap[m] = (growthMap[m] || 0) + 1;
    }
    const growth = Object.entries(growthMap).sort(([x], [y]) => x.localeCompare(y)).map(([month, count]) => ({ month, count }));

    rows.sort((a, b) => (a.daysLeft ?? 99999) - (b.daysLeft ?? 99999));
    return Response.json({ summary, subscriptions: rows, companiesWithoutSubscription: noSub, growth, latestFeedback });
  } catch (error) {
    console.error('subscriptionOverview error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});