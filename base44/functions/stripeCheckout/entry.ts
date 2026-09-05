import Stripe from 'npm:stripe@17.4.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { resolveAppOrigin } from '../../shared/publicHosts.ts';

const PLAN_PRICES = {
  monthly: {
    starter: 'price_1Tro3sAz7ujPvPWo7k0AlkdX',
    professional: 'price_1Tro3sAz7ujPvPWoIBbqHn9U',
    enterprise: 'price_1Tro3sAz7ujPvPWotQRKoAwm',
  },
  yearly: {
    starter: 'price_1TsHYVAz7ujPvPWoBYJSnewC',
    professional: 'price_1TsHYVAz7ujPvPWoDT5T2QpW',
    enterprise: 'price_1TsHYVAz7ujPvPWofmRS51uY',
  },
};

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
    const body = await req.json();
    const action = body.action;

    if (action === 'createSession') {
      const { plan, companyName, ownerEmail, returnUrl, billing, authMethod, companyId, sessionToken } = body;
      let appOrigin;
      try {
        const candidate = new URL(String(returnUrl || ''));
        if (candidate.protocol !== 'https:' || resolveAppOrigin(candidate.origin) !== candidate.origin) {
          throw new Error('Invalid return URL');
        }
        appOrigin = candidate.origin;
      } catch {
        return Response.json({ error: 'Invalid return URL' }, { status: 400 });
      }
      const interval = billing === 'yearly' ? 'yearly' : 'monthly';
      const priceId = PLAN_PRICES[interval][plan];
      if (!priceId) return Response.json({ error: 'Invalid plan' }, { status: 400 });
      const base44 = createClientFromRequest(req);
      let renewalAccount = null;
      if (companyId) {
        const sessions = await base44.asServiceRole.entities.CompanySession.filter({ companyId, token: sessionToken });
        const activeSession = sessions.find((item) => item.role === 'owner' && new Date(item.expiresAt).getTime() > Date.now());
        if (!activeSession) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        const accounts = await base44.asServiceRole.entities.CompanyAccount.filter({ companyId });
        renewalAccount = accounts[0] || null;
        if (!renewalAccount) return Response.json({ error: 'Account not found' }, { status: 404 });
      } else {
        if (!companyName || !ownerEmail) return Response.json({ error: 'Missing companyName or ownerEmail' }, { status: 400 });
        const dupes = await base44.asServiceRole.entities.CompanyAccount.filter({ ownerEmail: String(ownerEmail).trim().toLowerCase() });
        const companyDupes = dupes.filter((d) => String(d.plan || '').toLowerCase() !== 'individual');
        if (companyDupes.length) return Response.json({ error: 'email_exists' }, { status: 409 });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: renewalAccount?.ownerEmail || ownerEmail,
        success_url: `${appOrigin}/pricing-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appOrigin}/pricing`,
        metadata: {
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
          plan,
          companyName: renewalAccount?.name || companyName || '',
          ownerEmail: renewalAccount?.ownerEmail || ownerEmail || '',
          companyId: renewalAccount?.companyId || '',
          renewal: renewalAccount ? 'true' : 'false',
          authMethod: authMethod === 'google' ? 'google' : 'password',
        },
      });

      return Response.json({ url: session.url });
    }

    if (action === 'verifySession') {
      const { sessionId } = body;
      if (!sessionId) return Response.json({ error: 'Missing sessionId' }, { status: 400 });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const belongsToApp = session.metadata?.base44_app_id === Deno.env.get('BASE44_APP_ID');
      const paid = belongsToApp && session.status === 'complete' && session.mode === 'subscription';
      const renewal = session.metadata?.renewal === 'true' && !!session.metadata?.companyId;
      if (paid && renewal) {
        const base44 = createClientFromRequest(req);
        const accounts = await base44.asServiceRole.entities.CompanyAccount.filter({ companyId: session.metadata.companyId });
        if (accounts[0]) await base44.asServiceRole.entities.CompanyAccount.update(accounts[0].id, { plan: session.metadata.plan === 'professional' ? 'Professional' : session.metadata.plan === 'enterprise' ? 'Enterprise' : 'Starter', subscriptionStart: new Date().toISOString().slice(0, 10), subscriptionEnd: null });
      }
      return Response.json({
        paid,
        plan: session.metadata?.plan,
        companyName: session.metadata?.companyName,
        ownerEmail: session.metadata?.ownerEmail,
        authMethod: session.metadata?.authMethod || 'password',
        renewal,
        companyId: session.metadata?.companyId || null,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('stripeCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});