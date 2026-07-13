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

    // Registered companies (to match subscriptions to company names).
    const accounts = await base44.asServiceRole.entities.CompanyAccount.list('-created_date', 500);
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
        companyName: account?.name || s.metadata?.companyName || '',
        email,
        plan: priceInfo.plan || account?.plan || '—',
        billing: priceInfo.billing || '',
        status: s.status, // trialing | active | past_due | canceled | unpaid | incomplete
        cancelAtPeriodEnd: !!s.cancel_at_period_end,
        startedAt: s.start_date ? s.start_date * 1000 : null,
        endsAt: endTs || null,
        daysLeft: endTs ? Math.ceil((endTs - now) / 86400000) : null,
        amount: s.items?.data?.[0]?.price?.unit_amount != null ? s.items.data[0].price.unit_amount / 100 : null,
        currency: (s.items?.data?.[0]?.price?.currency || 'usd').toUpperCase(),
      };
    });

    // Companies registered without any Stripe subscription (free/manual).
    const subEmails = new Set(rows.map((r) => r.email.toLowerCase()).filter(Boolean));
    const noSub = accounts
      .filter((a) => a.ownerEmail && !subEmails.has(a.ownerEmail.toLowerCase()))
      .map((a) => ({ companyName: a.name || '', email: a.ownerEmail, plan: a.plan || 'Free', status: 'no_subscription' }));

    const active = rows.filter((r) => r.status === 'active' || r.status === 'trialing');
    const summary = {
      totalCompanies: accounts.length,
      activeSubscriptions: active.length,
      trialing: rows.filter((r) => r.status === 'trialing').length,
      pastDue: rows.filter((r) => r.status === 'past_due' || r.status === 'unpaid').length,
      canceled: rows.filter((r) => r.status === 'canceled').length,
      endingSoon: active.filter((r) => r.daysLeft != null && r.daysLeft <= 14 && (r.cancelAtPeriodEnd || r.status === 'trialing')).length,
      byPlan: {
        Starter: active.filter((r) => r.plan === 'Starter').length,
        Professional: active.filter((r) => r.plan === 'Professional').length,
        Enterprise: active.filter((r) => r.plan === 'Enterprise').length,
      },
    };

    rows.sort((a, b) => (a.daysLeft ?? 99999) - (b.daysLeft ?? 99999));
    return Response.json({ summary, subscriptions: rows, companiesWithoutSubscription: noSub });
  } catch (error) {
    console.error('subscriptionOverview error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});