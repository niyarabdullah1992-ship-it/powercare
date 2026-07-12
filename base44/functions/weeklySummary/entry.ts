import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { createMimeMessage } from 'npm:mimetext@3.0.24';

// Weekly owner digest — called by the "Weekly Owner Summary" scheduled workflow.
// For every company account: gathers tasks (Supabase targets), complaints and daily
// reports, then emails an Arabic summary to the company owner via the connected Gmail.
function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const SUPABASE_URL = (Deno.env.get('SUPABASE_URL') || '').replace(/\/+$/, '').replace(/\/rest\/v\d+$/, '');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const sbHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

    // All task targets, fetched once and matched per company below.
    let allTargets = [];
    if (SUPABASE_URL && SERVICE_KEY) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/targets?select=id,status,end_date,created_at,station_id,assignment_id,employee_id,manager_id`, { headers: sbHeaders });
      if (res.ok) allTargets = await res.json();
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const weekAgo = Date.now() - 7 * 86400000;
    const accounts = await base44.asServiceRole.entities.CompanyAccount.list(undefined, 200);
    const results = [];

    for (const acc of accounts) {
      try {
        if (!acc.ownerEmail || acc.ownerEmail.includes('@powercare-demo.com')) continue;
        const companyId = acc.companyId;
        const [employees, stations, reportBlobs, complaintBlobs] = await Promise.all([
          base44.asServiceRole.entities.Employee.filter({ companyId }, undefined, 500),
          base44.asServiceRole.entities.Station.filter({ companyId }, undefined, 200),
          base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId, category: 'reports' }),
          base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId, category: 'anonymousReports' }),
        ]);

        // Match this company's tasks by its own station/employee ids.
        const empIds = new Set(employees.map((e) => e.employeeId));
        const stationIds = new Set(stations.map((s) => s.stationId));
        const targets = allTargets.filter((tg) =>
          stationIds.has(tg.station_id) || stationIds.has(tg.assignment_id) ||
          empIds.has(tg.employee_id) || empIds.has(tg.manager_id)
        );

        const active = targets.filter((tg) => tg.status === 'active').length;
        const overdue = targets.filter((tg) => tg.status === 'overdue').length;
        const pendingReview = targets.filter((tg) => tg.status === 'pending_review').length;
        const completedThisWeek = targets.filter((tg) => tg.status === 'completed' && new Date(tg.end_date || tg.created_at).getTime() >= weekAgo).length;
        const newThisWeek = targets.filter((tg) => new Date(tg.created_at).getTime() >= weekAgo).length;

        const reports = reportBlobs[0]?.payload || [];
        const reportsThisWeek = reports.filter((r) => new Date(r.createdAt).getTime() >= weekAgo).length;
        const complaints = complaintBlobs[0]?.payload || [];
        const openComplaints = complaints.filter((c) => c.status !== 'closed').length;
        const newComplaintsThisWeek = complaints.filter((c) => new Date(c.createdAt).getTime() >= weekAgo).length;

        const text = [
          `مرحبًا،`,
          ``,
          `هذا الملخص الأسبوعي لشركة "${acc.name || 'شركتك'}" على منصة PowerCare:`,
          ``,
          `👥 الموظفون: ${employees.length} — المحطات: ${stations.length}`,
          ``,
          `📋 المهام:`,
          `• مهام جديدة هذا الأسبوع: ${newThisWeek}`,
          `• قيد التنفيذ: ${active}`,
          `• بانتظار المراجعة: ${pendingReview}`,
          `• متأخرة: ${overdue}`,
          `• أُنجزت هذا الأسبوع: ${completedThisWeek}`,
          ``,
          `📝 التقارير اليومية المقدمة هذا الأسبوع: ${reportsThisWeek}`,
          ``,
          `📢 الشكاوى والبلاغات:`,
          `• جديدة هذا الأسبوع: ${newComplaintsThisWeek}`,
          `• لا تزال مفتوحة: ${openComplaints}`,
          ``,
          `للاطلاع على التفاصيل الكاملة، تفضل بالدخول إلى منصة PowerCare.`,
          ``,
          `— فريق PowerCare`,
        ].join('\n');

        const msg = createMimeMessage();
        msg.setSender({ name: 'PowerCare', addr: 'no-reply@powercare.app' });
        msg.setRecipient(acc.ownerEmail);
        msg.setSubject(`PowerCare — الملخص الأسبوعي لشركة ${acc.name || ''}`.trim());
        msg.addMessage({ contentType: 'text/plain', data: text });

        const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: toBase64Url(msg.asRaw()) }),
        });
        if (!sendRes.ok) {
          const errText = await sendRes.text();
          console.error(`Gmail send failed for ${acc.ownerEmail}, falling back to platform email:`, errText.slice(0, 200));
          // Fallback: the platform's built-in email when the connected Gmail can't send.
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: 'PowerCare',
            to: acc.ownerEmail,
            subject: `PowerCare — الملخص الأسبوعي لشركة ${acc.name || ''}`.trim(),
            body: text,
          });
          results.push({ companyId, sent: true, via: 'platform', gmailError: errText.slice(0, 300) });
        } else {
          results.push({ companyId, sent: true, via: 'gmail' });
        }
      } catch (e) {
        console.error(`Weekly summary failed for company ${acc.companyId}:`, e.message);
        results.push({ companyId: acc.companyId, sent: false, error: e.message });
      }
    }

    return Response.json({ ok: true, results });
  } catch (error) {
    console.error('weeklySummary error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});