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

const EMAIL_LOGO = 'https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/df3e1cbab_generated_image.png';
function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function metric(label, value) {
  return `<td width="33.33%" style="padding:5px;"><div style="padding:15px 8px;border:1px solid #eadfc9;border-radius:12px;background:#faf6ee;text-align:center;"><div style="font-size:24px;font-weight:700;color:#b8863e;">${value}</div><div style="margin-top:4px;font-size:12px;color:#75644d;">${label}</div></div></td>`;
}
function detailRow(label, value, last = false) {
  return `<tr><td style="padding:11px 14px;font-size:13px;color:#75644d;${last ? '' : 'border-bottom:1px solid #f0e8d8;'}">${label}</td><td style="padding:11px 14px;font-size:14px;font-weight:700;color:#3a2f22;text-align:left;${last ? '' : 'border-bottom:1px solid #f0e8d8;'}">${value}</td></tr>`;
}
function weeklySummaryHtml(companyName, stats) {
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><body style="margin:0;padding:0;background:#f5efe4;font-family:Arial,Tahoma,sans-serif;direction:rtl;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe4;padding:32px 12px;"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #eadfc9;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(76,55,28,.08);">
      <tr><td style="padding:28px;text-align:center;background:linear-gradient(180deg,#d8b578,#b8863e);">
        <img src="${EMAIL_LOGO}" width="54" height="54" alt="PowerCare" style="display:block;margin:0 auto 9px;" />
        <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:1px;color:#ffffff;">PowerCare</div>
        <div style="margin-top:7px;font-size:13px;color:#fff8ec;">الملخص الأسبوعي لأداء شركتك</div>
      </td></tr>
      <tr><td style="padding:28px 28px 12px;">
        <h1 style="margin:0 0 8px;font-size:21px;color:#3a2f22;">مرحبًا،</h1>
        <p style="margin:0 0 22px;font-size:14px;line-height:1.8;color:#75644d;">إليك ملخص أداء <strong style="color:#3a2f22;">${escapeHtml(companyName)}</strong> خلال الأيام السبعة الماضية.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          ${metric('الموظفون', stats.employees)}${metric('المحطات', stats.stations)}${metric('مهام مكتملة', stats.completedThisWeek)}
        </tr></table>
        <h2 style="margin:24px 0 10px;font-size:15px;color:#3a2f22;">المهام</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eadfc9;border-radius:12px;background:#fffdf9;overflow:hidden;">
          ${detailRow('مهام جديدة هذا الأسبوع', stats.newThisWeek)}${detailRow('قيد التنفيذ', stats.active)}${detailRow('بانتظار المراجعة', stats.pendingReview)}${detailRow('مهام متأخرة', stats.overdue, true)}
        </table>
        <h2 style="margin:22px 0 10px;font-size:15px;color:#3a2f22;">التقارير والبلاغات</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eadfc9;border-radius:12px;background:#fffdf9;overflow:hidden;">
          ${detailRow('التقارير اليومية المقدمة', stats.reportsThisWeek)}${detailRow('بلاغات جديدة هذا الأسبوع', stats.newComplaintsThisWeek)}${detailRow('بلاغات لا تزال مفتوحة', stats.openComplaints, true)}
        </table>
        <p style="margin:22px 0 10px;padding:14px;border-radius:10px;background:#faf6ee;font-size:13px;line-height:1.8;color:#75644d;text-align:center;">للاطلاع على التفاصيل الكاملة واتخاذ الإجراءات، تفضل بالدخول إلى منصة PowerCare.</p>
      </td></tr>
      <tr><td style="padding:18px 28px 24px;border-top:1px solid #f0e8d8;text-align:center;">
        <p style="margin:0;font-size:12px;color:#a08c6a;">PowerCare — إدارة ذكية لفريقك ومهامك</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (body.dryRun === true) {
      const preview = weeklySummaryHtml('شركة تجريبية', { employees: 12, stations: 3, completedThisWeek: 8, newThisWeek: 10, active: 6, pendingReview: 2, overdue: 1, reportsThisWeek: 5, newComplaintsThisWeek: 1, openComplaints: 2 });
      return Response.json({ ok: true, previewGenerated: true, htmlLength: preview.length });
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
          `الموظفون: ${employees.length} — المحطات: ${stations.length}`,
          ``,
          `المهام:`,
          `• مهام جديدة هذا الأسبوع: ${newThisWeek}`,
          `• قيد التنفيذ: ${active}`,
          `• بانتظار المراجعة: ${pendingReview}`,
          `• متأخرة: ${overdue}`,
          `• أُنجزت هذا الأسبوع: ${completedThisWeek}`,
          ``,
          `التقارير اليومية المقدمة هذا الأسبوع: ${reportsThisWeek}`,
          ``,
          `الشكاوى والبلاغات:`,
          `• جديدة هذا الأسبوع: ${newComplaintsThisWeek}`,
          `• لا تزال مفتوحة: ${openComplaints}`,
          ``,
          `للاطلاع على التفاصيل الكاملة، تفضل بالدخول إلى منصة PowerCare.`,
          ``,
          `— فريق PowerCare`,
        ].join('\n');
        const html = weeklySummaryHtml(acc.name || 'شركتك', {
          employees: employees.length,
          stations: stations.length,
          completedThisWeek,
          newThisWeek,
          active,
          pendingReview,
          overdue,
          reportsThisWeek,
          newComplaintsThisWeek,
          openComplaints,
        });

        const msg = createMimeMessage();
        msg.setSender({ name: 'PowerCare', addr: 'no-reply@powercare.app' });
        msg.setRecipient(acc.ownerEmail);
        msg.setSubject(`PowerCare — الملخص الأسبوعي لشركة ${acc.name || ''}`.trim());
        msg.addMessage({ contentType: 'text/html', data: html });

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