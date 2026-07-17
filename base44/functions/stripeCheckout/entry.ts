import Stripe from 'npm:stripe@17.4.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

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
      const { plan, companyName, ownerEmail, returnUrl, billing, authMethod } = body;
      let appOrigin;
      try {
        const candidate = new URL(String(returnUrl || ''));
        const allowedHost = /^([a-z0-9-]+\.)*(powercares\.pro|base44\.app)$/i;
        if (candidate.protocol !== 'https:' || !allowedHost.test(candidate.hostname)) throw new Error('Invalid return URL');
        appOrigin = candidate.origin;
      } catch {
        return Response.json({ error: 'Invalid return URL' }, { status: 400 });
      }
      const interval = billing === 'yearly' ? 'yearly' : 'monthly';
      const priceId = PLAN_PRICES[interval][plan];
      if (!priceId) return Response.json({ error: 'Invalid plan' }, { status: 400 });
      if (!companyName || !ownerEmail) return Response.json({ error: 'Missing companyName or ownerEmail' }, { status: 400 });

      // Block duplicate signups: this email already owns another COMPANY account.
      // An existing individual workspace does not block a paid company signup.
      const base44 = createClientFromRequest(req);
      const dupes = await base44.asServiceRole.entities.CompanyAccount.filter({ ownerEmail: String(ownerEmail).trim().toLowerCase() });
      const companyDupes = dupes.filter((d) => String(d.plan || '').toLowerCase() !== 'individual');
      if (companyDupes.length) return Response.json({ error: 'email_exists' }, { status: 409 });

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: ownerEmail,
        subscription_data: {
          trial_period_days: 120,
        },
        success_url: `${appOrigin}/pricing-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appOrigin}/pricing`,
        metadata: {
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
          plan,
          companyName,
          ownerEmail,
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
      return Response.json({
        paid: belongsToApp && session.status === 'complete' && session.mode === 'subscription',
        plan: session.metadata?.plan,
        companyName: session.metadata?.companyName,
        ownerEmail: session.metadata?.ownerEmail,
        authMethod: session.metadata?.authMethod || 'password',
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('stripeCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});