import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendSubscriptionInvoiceEmail } from '../../shared/subscriptionInvoiceEmail.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const tapKey = Deno.env.get('TAP_SECRET_KEY');
    const tapRequest = async (path, options = {}) => {
      const response = await fetch(`https://api.tap.company/v2${path}`, { ...options, headers: { Authorization: `Bearer ${tapKey}`, accept: 'application/json', 'content-type': 'application/json', ...(options.headers || {}) } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.errors?.[0]?.description || data?.message || `Tap request failed (${response.status})`);
      return data;
    };
    const requireAdmin = async () => {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') throw new Error('Forbidden');
      return user;
    };
    const statusOf = (status) => status === 'CAPTURED' ? 'paid' : ['VOID', 'CANCELLED', 'ABANDONED'].includes(status) ? 'void' : ['FAILED', 'DECLINED', 'RESTRICTED'].includes(status) ? 'failed' : status === 'REFUNDED' ? 'refunded' : 'pending';

    if (action === 'createCharge') {
      const { plan, billing, companyName, ownerEmail, returnUrl, authMethod, companyId, sessionToken } = body;
      let origin;
      try {
        const url = new URL(String(returnUrl || ''));
        if (url.protocol !== 'https:' || !/^([a-z0-9-]+\.)*(powercares\.pro|base44\.app)$/i.test(url.hostname)) throw new Error('invalid');
        origin = url.origin;
      } catch { return Response.json({ error: 'Invalid return URL' }, { status: 400 }); }
      const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ slug: String(plan), active: true });
      const selected = plans[0];
      if (!selected) return Response.json({ error: 'Invalid plan' }, { status: 400 });
      const interval = billing === 'yearly' ? 'yearly' : 'monthly';
      const price = Number(interval === 'yearly' ? selected.yearlyPrice : selected.monthlyPrice);
      if (selected.freeNow || !(price > 0)) return Response.json({ error: 'This plan is currently free' }, { status: 400 });
      let account = null;
      if (companyId) {
        const sessions = await base44.asServiceRole.entities.CompanySession.filter({ companyId: String(companyId), token: String(sessionToken || '') });
        if (!sessions.some((item) => item.role === 'owner' && new Date(item.expiresAt).getTime() > Date.now())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        const accounts = await base44.asServiceRole.entities.CompanyAccount.filter({ companyId: String(companyId) });
        account = accounts[0] || null;
      } else {
        if (!companyName || !ownerEmail) return Response.json({ error: 'Missing company details' }, { status: 400 });
        const duplicates = await base44.asServiceRole.entities.CompanyAccount.filter({ ownerEmail: String(ownerEmail).trim().toLowerCase() });
        if (duplicates.some((item) => String(item.plan || '').toLowerCase() !== 'individual')) return Response.json({ error: 'email_exists' }, { status: 409 });
      }
      const subtotal = Math.round(price * 100); const tax = Math.round(subtotal * 0.15); const total = subtotal + tax;
      const orderRef = `PC-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      const charge = await tapRequest('/charges/', { method: 'POST', body: JSON.stringify({
        amount: total / 100, currency: selected.currency || 'SAR', customer_initiated: true, threeDSecure: true, save_card: false,
        description: `PowerCare ${selected.nameEn} ${interval}`, statement_descriptor: 'POWERCARE',
        metadata: { udf1: Deno.env.get('BASE44_APP_ID'), udf2: selected.slug, udf3: interval },
        reference: { transaction: orderRef, order: orderRef }, receipt: { email: true, sms: false },
        customer: { first_name: String(account?.name || companyName || 'PowerCare').slice(0, 40), last_name: 'Customer', email: String(account?.ownerEmail || ownerEmail).trim().toLowerCase() },
        source: { id: 'src_all' }, redirect: { url: `${origin}/pricing-success` }
      }) });
      const createdAt = new Date().toISOString();
      await base44.asServiceRole.entities.SubscriptionPayment.create({
        chargeId: charge.id, invoiceNumber: `PC-${new Date().getFullYear()}-${String(charge.id).slice(-10).toUpperCase()}`,
        companyId: account?.companyId || null, companyName: account?.name || String(companyName), email: account?.ownerEmail || String(ownerEmail).trim().toLowerCase(),
        plan: selected.nameEn, billing: interval, authMethod: authMethod === 'google' ? 'google' : 'password', status: statusOf(charge.status),
        subtotal, tax, total, currency: String(charge.currency || selected.currency || 'SAR').toUpperCase(), createdAt,
        paidAt: null, receiptId: charge.receipt?.id || null, paymentReference: charge.reference?.payment || orderRef,
        cardLastFour: charge.card?.last_four || null, cardBrand: charge.card?.brand || null, activities: charge.activities || []
      });
      return Response.json({ url: charge.transaction?.url, chargeId: charge.id });
    }

    if (action === 'verifyCharge') {
      const chargeId = String(body.chargeId || '');
      if (!chargeId.startsWith('chg_')) return Response.json({ error: 'Invalid charge id' }, { status: 400 });
      const charge = await tapRequest(`/charges/${encodeURIComponent(chargeId)}`);
      if (charge.metadata?.udf1 !== Deno.env.get('BASE44_APP_ID')) return Response.json({ error: 'Payment does not belong to this app' }, { status: 403 });
      const records = await base44.asServiceRole.entities.SubscriptionPayment.filter({ chargeId });
      const payment = records[0];
      if (!payment) return Response.json({ error: 'Payment record not found' }, { status: 404 });
      const paid = charge.status === 'CAPTURED';
      const update = { status: statusOf(charge.status), paidAt: paid ? new Date().toISOString() : null, receiptId: charge.receipt?.id || payment.receiptId || null, paymentReference: charge.reference?.payment || payment.paymentReference || null, cardLastFour: charge.card?.last_four || null, cardBrand: charge.card?.brand || null, activities: charge.activities || [] };
      await base44.asServiceRole.entities.SubscriptionPayment.update(payment.id, update);
      if (paid && payment.companyId) {
        const accounts = await base44.asServiceRole.entities.CompanyAccount.filter({ companyId: payment.companyId });
        if (accounts[0]) {
          const end = new Date(); end.setDate(end.getDate() + (payment.billing === 'yearly' ? 365 : 30));
          await base44.asServiceRole.entities.CompanyAccount.update(accounts[0].id, { plan: payment.plan, subscriptionStart: new Date().toISOString().slice(0, 10), subscriptionEnd: end.toISOString().slice(0, 10), subscriptionExempt: false });
        }
      }
      if (paid && !payment.invoiceEmailSentAt) {
        try {
          await sendSubscriptionInvoiceEmail(base44, { ...payment, ...update });
          await base44.asServiceRole.entities.SubscriptionPayment.update(payment.id, { invoiceEmailSentAt: new Date().toISOString() });
        } catch (emailError) {
          console.error('Automatic invoice email failed:', emailError.message);
        }
      }
      return Response.json({ paid, plan: payment.plan, companyName: payment.companyName, ownerEmail: payment.email, authMethod: payment.authMethod, renewal: !!payment.companyId, companyId: payment.companyId || null });
    }

    if (action === 'listPayments') {
      await requireAdmin();
      const payments = await base44.asServiceRole.entities.SubscriptionPayment.list('-createdAt', 500);
      const invoices = payments.map((item) => ({ ...item, id: item.chargeId, number: item.invoiceNumber, status: item.status === 'paid' ? 'paid' : item.status === 'pending' ? 'open' : item.status === 'void' ? 'void' : 'uncollectible', createdAt: item.createdAt, finalizedAt: item.createdAt, paidAt: item.paidAt, voidedAt: item.status === 'void' ? item.updated_date : null, uncollectibleAt: item.status === 'failed' ? item.updated_date : null, amountPaid: item.status === 'paid' ? item.total : 0, amountDue: item.status === 'paid' ? 0 : item.total, hostedUrl: null, pdfUrl: null }));
      return Response.json({ invoices });
    }

    if (action === 'recordInvoiceAudit') {
      const user = await requireAdmin();
      const allowed = new Set(['viewed', 'exported_pdf', 'exported_excel', 'hosted_opened']);
      const event = String(body.event || '');
      if (!allowed.has(event)) return Response.json({ error: 'Invalid audit event' }, { status: 400 });
      await base44.asServiceRole.entities.AuditLog.create({ companyId: String(body.companyId || 'platform'), action: `invoice_${event}`, performedBy: user.email || user.full_name || 'Platform owner', details: `Tap invoice ${String(body.invoiceNumber || body.invoiceId || '—')} ${event.replaceAll('_', ' ')}`, oldValue: null, newValue: String(body.invoiceId || ''), reason: null });
      return Response.json({ ok: true });
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('tapPayments error:', error.message);
    return Response.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 500 });
  }
});