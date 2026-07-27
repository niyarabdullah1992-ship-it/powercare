import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@17.4.0';

// Maps Stripe price ids back to plan names (must mirror stripeCheckout).
const MANUAL_PLAN_MONTHLY_PRICE = { Starter: 49, Professional: 149, Enterprise: 249 };

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

    if (action === 'recordInvoiceAudit') {
      const allowed = new Set(['viewed', 'exported_pdf', 'exported_excel', 'hosted_opened']);
      const event = String(body.event || '');
      if (!allowed.has(event)) return Response.json({ error: 'Invalid invoice audit event' }, { status: 400 });
      await base44.asServiceRole.entities.AuditLog.create({
        companyId: String(body.companyId || 'platform'), action: `invoice_${event}`,
        performedBy: user.email || user.full_name || 'Platform owner',
        details: `Invoice ${String(body.invoiceNumber || body.invoiceId || '—')} ${event.replaceAll('_', ' ')}`,
        oldValue: null, newValue: String(body.invoiceId || ''), reason: null,
      });
      return Response.json({ ok: true });
    }

    if (action === 'invoices') {
      const accounts = await base44.asServiceRole.entities.CompanyAccount.list('-created_date', 500);
      const byEmail = Object.fromEntries(accounts.map((account) => [String(account.ownerEmail || '').toLowerCase(), account]));
      const invoices = []; let startingAfter;
      while (invoices.length < 500) {
        const page = await stripe.invoices.list({ limit: 100, expand: ['data.customer'], ...(startingAfter ? { starting_after: startingAfter } : {}) });
        for (const invoice of page.data) {
          const customer = typeof invoice.customer === 'object' ? invoice.customer : null;
          const email = String(invoice.customer_email || customer?.email || '').toLowerCase();
          const account = byEmail[email];
          const transitions = invoice.status_transitions || {};
          invoices.push({
            id: invoice.id, number: invoice.number || `DRAFT-${invoice.id.slice(-8).toUpperCase()}`,
            companyId: account?.companyId || null, companyName: account?.name || invoice.customer_name || email,
            email, subscriptionId: typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id || null,
            status: invoice.status || 'draft', currency: String(invoice.currency || 'usd').toUpperCase(),
            subtotal: invoice.subtotal || 0, tax: (invoice.total_tax_amounts || []).reduce((sum, item) => sum + Number(item.amount || 0), 0),
            total: invoice.total || 0, amountPaid: invoice.amount_paid || 0, amountDue: invoice.amount_due || 0,
            createdAt: new Date(invoice.created * 1000).toISOString(), dueAt: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
            periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
            periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
            finalizedAt: transitions.finalized_at ? new Date(transitions.finalized_at * 1000).toISOString() : null,
            paidAt: transitions.paid_at ? new Date(transitions.paid_at * 1000).toISOString() : null,
            voidedAt: transitions.voided_at ? new Date(transitions.voided_at * 1000).toISOString() : null,
            uncollectibleAt: transitions.marked_uncollectible_at ? new Date(transitions.marked_uncollectible_at * 1000).toISOString() : null,
            hostedUrl: invoice.hosted_invoice_url || null, pdfUrl: invoice.invoice_pdf || null,
          });
        }
        if (!page.has_more || !page.data.length) break;
        startingAfter = page.data[page.data.length - 1].id;
      }
      return Response.json({ invoices });
    }
    
    if (['freeze', 'unfreeze', 'extend', 'changePlan', 'updateAccount', 'activate', 'deactivate', 'addDays', 'exempt', 'removeExemption'].includes(action)) {
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
      } else if (action === 'activate') {
        const start = new Date();
        const end = new Date(Math.max(Date.now(), Date.parse(account.subscriptionEnd || '') || 0) + 30 * 86400000);
        await base44.asServiceRole.entities.CompanyAccount.update(account.id, { plan: !account.plan || account.plan === 'Free' ? 'Starter' : account.plan, subscriptionStart: start.toISOString().slice(0, 10), subscriptionEnd: end.toISOString().slice(0, 10), subscriptionExempt: false, exemptReason: null, exemptedAt: null, frozen: false, frozenAt: null, frozenReason: null });
        await auditAction(account, 'subscription_activated', account.subscriptionEnd || 'inactive', end.toISOString().slice(0, 10), body.reason);
      } else if (action === 'deactivate') {
        const end = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        await base44.asServiceRole.entities.CompanyAccount.update(account.id, { subscriptionEnd: end, subscriptionExempt: false, exemptReason: null, exemptedAt: null });
        await auditAction(account, 'subscription_deactivated', account.subscriptionEnd || 'active', end, body.reason);
      } else if (action === 'addDays') {
        const days = Math.min(3650, Math.max(1, Number(body.days) || 0));
        const base = Math.max(Date.now(), Date.parse(account.subscriptionEnd || '') || 0);
        const end = new Date(base + days * 86400000).toISOString().slice(0, 10);
        await base44.asServiceRole.entities.CompanyAccount.update(account.id, { subscriptionStart: account.subscriptionStart || new Date().toISOString().slice(0, 10), subscriptionEnd: end, frozen: false, frozenAt: null, frozenReason: null });
        await auditAction(account, 'subscription_days_added', account.subscriptionEnd || '—', end, `${days} days`);
      } else if (action === 'exempt') {
        const reason = String(body.reason || '').trim();
        if (!reason) return Response.json({ error: 'Exemption reason is required' }, { status: 400 });
        await base44.asServiceRole.entities.CompanyAccount.update(account.id, { subscriptionExempt: true, exemptReason: reason, exemptedAt: new Date().toISOString(), frozen: false, frozenAt: null, frozenReason: null });
        await auditAction(account, 'subscription_exempted', 'billable', 'exempt', reason);
      } else if (action === 'removeExemption') {
        await base44.asServiceRole.entities.CompanyAccount.update(account.id, { subscriptionExempt: false, exemptReason: null, exemptedAt: null });
        await auditAction(account, 'subscription_exemption_removed', 'exempt', 'billable', body.reason);
      } else {
        const validPlans = new Set(['Starter', 'Professional', 'Enterprise', 'Custom']);
        if ((action === 'changePlan' || action === 'updateAccount') && body.plan !== undefined) {
          if (!validPlans.has(String(body.plan))) return Response.json({ error: 'Invalid plan' }, { status: 400 });
          const freePlan = body.freePlan === true;
          const customPrice = body.plan === 'Custom' && !freePlan ? Math.max(0, Number(body.customPrice) || 0) : null;
          await base44.asServiceRole.entities.CompanyAccount.update(account.id, { plan: body.plan, customPrice, subscriptionExempt: freePlan, exemptReason: freePlan ? 'Plan made free by platform owner' : null, exemptedAt: freePlan ? new Date().toISOString() : null });
          const metaRows = await base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId: account.companyId, category: 'companyMeta' });
          if (metaRows[0]?.payload?.[0]) {
            const payload = [...metaRows[0].payload];
            payload[0] = { ...payload[0], plan: body.plan };
            await base44.asServiceRole.entities.CompanyDataBlob.update(metaRows[0].id, { payload });
          }
          const signals = await base44.asServiceRole.entities.SyncSignal.filter({ companyId: account.companyId });
          if (signals[0]) await base44.asServiceRole.entities.SyncSignal.update(signals[0].id, { version: Number(signals[0].version || 0) + 1 });
          else await base44.asServiceRole.entities.SyncSignal.create({ companyId: account.companyId, version: 1 });
          if (account.plan !== body.plan || account.customPrice !== customPrice || account.subscriptionExempt !== freePlan) await auditAction(account, 'subscription_plan_changed', `${account.plan || '—'}${account.subscriptionExempt ? ' (free)' : account.customPrice != null ? ` ($${account.customPrice})` : ''}`, `${body.plan}${freePlan ? ' (free)' : customPrice != null ? ` ($${customPrice})` : ''}`, body.reason);
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
      const accountEndTs = account?.subscriptionEnd ? Date.parse(account.subscriptionEnd) : null;
      const manualActive = !!accountEndTs && accountEndTs > now && ['canceled', 'unpaid', 'past_due'].includes(s.status);
      return {
        id: s.id,
        accountId: account?.id || null,
        companyName: account?.name || s.metadata?.companyName || '',
        email,
        plan: account?.plan || priceInfo.plan || '—',
        billing: priceInfo.billing || '',
        status: account?.subscriptionExempt ? 'exempt' : (manualActive ? 'manual_active' : s.status),
        cancelAtPeriodEnd: !!s.cancel_at_period_end,
        startedAt: account?.subscriptionStart ? Date.parse(account.subscriptionStart) : (s.start_date ? s.start_date * 1000 : null),
        endsAt: account?.subscriptionExempt ? null : (account?.subscriptionEnd ? Date.parse(account.subscriptionEnd) : (endTs || null)),
        daysLeft: account?.subscriptionExempt ? null : (account?.subscriptionEnd ? Math.ceil((Date.parse(account.subscriptionEnd) - now) / 86400000) : (endTs ? Math.ceil((endTs - now) / 86400000) : null)),
        amount: account?.subscriptionExempt ? 0 : (s.items?.data?.[0]?.price?.unit_amount != null ? s.items.data[0].price.unit_amount / 100 : null),
        currency: (s.items?.data?.[0]?.price?.currency || 'usd').toUpperCase(),
        exempt: account?.subscriptionExempt === true,
        isFree: account?.subscriptionExempt === true || s.items?.data?.[0]?.price?.unit_amount === 0,
        exemptReason: account?.exemptReason || null,
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
        const manualActive = a.subscriptionExempt === true || (!!endTs && endTs > now && (a.plan || 'Free') !== 'Free');
        return {
          accountId: a.id,
          companyName: a.name || '',
          email: a.ownerEmail,
          plan: a.plan || 'Free',
          status: a.subscriptionExempt ? 'exempt' : (manualActive ? 'manual_active' : 'no_subscription'),
          startedAt: startTs,
          endsAt: a.subscriptionExempt ? null : endTs,
          daysLeft: a.subscriptionExempt ? null : (endTs ? Math.ceil((endTs - now) / 86400000) : null),
          amount: a.subscriptionExempt ? 0 : Math.max(0, Number(a.customPrice) || 0),
          customPrice: a.subscriptionExempt ? 0 : (a.customPrice ?? null),
          exempt: a.subscriptionExempt === true,
          isFree: a.subscriptionExempt === true || !(Number(a.customPrice) > 0),
          exemptReason: a.exemptReason || null,
          frozen: a.frozen === true,
          frozenAt: a.frozenAt || null,
          frozenReason: a.frozenReason || null,
        };
      });

    const active = rows.filter((r) => ['active', 'trialing', 'manual_active'].includes(r.status));
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
    const manualMrr = noSub.filter((r) => r.status === 'manual_active' && !r.isFree).reduce((sum, r) => sum + (r.amount || 0), 0);
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