import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { createMimeMessage } from 'npm:mimetext@3.0.24';
import { POWERCARE_LOGO_URL } from '../../shared/brand.ts';

// Weekly owner digest — called by the "Weekly Owner Summary" scheduled workflow.
// For every company account: gathers tasks (Supabase targets), complaints and daily
// reports, then emails an Arabic summary to the company owner via the connected Gmail.
function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function metric(label, value) {
  return `<td width="33.33%" style="padding:5px;"><div style="padding:15px 8px;border:1px solid #eadfc9;border-radius:12px;background:#faf6ee;text-align:center;"><div style="font-size:24px;font-weight:700;color:#b8863e;">${value}</div><div style="margin-top:4px;font-size:12px;color:#75644d;">${label}</div></div></td>`;
}
function detailRow(label, value, last = false) {
  return `<tr><td style="padding:11px 14px;font-size:13px;color:#75644d;${last ? '' : 'border-bottom:1px solid #f0e8d8;'}">${label}</td><td style="padding:11px 14px;font-size:14px;font-weight:700;color:#3a2f22;text-align:left;${last ? '' : 'border-bottom:1px solid #f0e8d8;'}">${value}</td></tr>`;
}
const EMAIL_COPY = {
  en: { dir:'ltr', subject:'Weekly summary for', header:'Your company weekly performance summary', hello:'Hello,', intro:'Here is the performance summary for', period:'over the past seven days.', employees:'Employees', stations:'Stations', completed:'Tasks completed', tasks:'Tasks', newTasks:'New tasks this week', active:'In progress', review:'Awaiting review', overdue:'Overdue tasks', reports:'Reports and notices', dailyReports:'Daily reports submitted', newNotices:'New notices this week', openNotices:'Notices still open', cta:'Sign in to PowerCare to review full details and take action.', footer:'Smart management for your team and tasks' },
  ar: { dir:'rtl', subject:'الملخص الأسبوعي لشركة', header:'الملخص الأسبوعي لأداء شركتك', hello:'مرحبًا،', intro:'إليك ملخص أداء', period:'خلال الأيام السبعة الماضية.', employees:'الموظفون', stations:'المحطات', completed:'مهام مكتملة', tasks:'المهام', newTasks:'مهام جديدة هذا الأسبوع', active:'قيد التنفيذ', review:'بانتظار المراجعة', overdue:'مهام متأخرة', reports:'التقارير والبلاغات', dailyReports:'التقارير اليومية المقدمة', newNotices:'بلاغات جديدة هذا الأسبوع', openNotices:'بلاغات لا تزال مفتوحة', cta:'للاطلاع على التفاصيل الكاملة واتخاذ الإجراءات، تفضل بالدخول إلى منصة PowerCare.', footer:'إدارة ذكية لفريقك ومهامك' },
  de: { dir:'ltr', subject:'Wöchentliche Zusammenfassung für', header:'Wöchentliche Leistungsübersicht Ihres Unternehmens', hello:'Hallo,', intro:'Hier ist die Leistungsübersicht für', period:'der letzten sieben Tage.', employees:'Mitarbeiter', stations:'Standorte', completed:'Erledigte Aufgaben', tasks:'Aufgaben', newTasks:'Neue Aufgaben diese Woche', active:'In Bearbeitung', review:'Warten auf Prüfung', overdue:'Überfällige Aufgaben', reports:'Berichte und Meldungen', dailyReports:'Eingereichte Tagesberichte', newNotices:'Neue Meldungen diese Woche', openNotices:'Noch offene Meldungen', cta:'Melden Sie sich bei PowerCare an, um alle Details zu prüfen und Maßnahmen zu ergreifen.', footer:'Intelligentes Management für Team und Aufgaben' },
  fr: { dir:'ltr', subject:'Résumé hebdomadaire de', header:'Résumé hebdomadaire des performances de votre entreprise', hello:'Bonjour,', intro:'Voici le résumé des performances de', period:'au cours des sept derniers jours.', employees:'Employés', stations:'Stations', completed:'Tâches terminées', tasks:'Tâches', newTasks:'Nouvelles tâches cette semaine', active:'En cours', review:'En attente de validation', overdue:'Tâches en retard', reports:'Rapports et signalements', dailyReports:'Rapports quotidiens soumis', newNotices:'Nouveaux signalements cette semaine', openNotices:'Signalements toujours ouverts', cta:'Connectez-vous à PowerCare pour consulter tous les détails et agir.', footer:'Gestion intelligente de votre équipe et de vos tâches' },
  es: { dir:'ltr', subject:'Resumen semanal de', header:'Resumen semanal del rendimiento de tu empresa', hello:'Hola,', intro:'Este es el resumen de rendimiento de', period:'durante los últimos siete días.', employees:'Empleados', stations:'Estaciones', completed:'Tareas completadas', tasks:'Tareas', newTasks:'Tareas nuevas esta semana', active:'En curso', review:'Pendientes de revisión', overdue:'Tareas vencidas', reports:'Informes y avisos', dailyReports:'Informes diarios enviados', newNotices:'Avisos nuevos esta semana', openNotices:'Avisos aún abiertos', cta:'Inicia sesión en PowerCare para revisar todos los detalles y tomar medidas.', footer:'Gestión inteligente de tu equipo y tareas' },
  pt: { dir:'ltr', subject:'Resumo semanal de', header:'Resumo semanal do desempenho da sua empresa', hello:'Olá,', intro:'Aqui está o resumo de desempenho de', period:'nos últimos sete dias.', employees:'Funcionários', stations:'Estações', completed:'Tarefas concluídas', tasks:'Tarefas', newTasks:'Novas tarefas nesta semana', active:'Em andamento', review:'Aguardando revisão', overdue:'Tarefas atrasadas', reports:'Relatórios e avisos', dailyReports:'Relatórios diários enviados', newNotices:'Novos avisos nesta semana', openNotices:'Avisos ainda abertos', cta:'Entre no PowerCare para revisar todos os detalhes e tomar medidas.', footer:'Gestão inteligente da sua equipe e tarefas' },
  ru: { dir:'ltr', subject:'Еженедельная сводка для', header:'Еженедельная сводка работы вашей компании', hello:'Здравствуйте,', intro:'Вот сводка показателей компании', period:'за последние семь дней.', employees:'Сотрудники', stations:'Станции', completed:'Завершённые задачи', tasks:'Задачи', newTasks:'Новые задачи за неделю', active:'В работе', review:'Ожидают проверки', overdue:'Просроченные задачи', reports:'Отчёты и обращения', dailyReports:'Поданные ежедневные отчёты', newNotices:'Новые обращения за неделю', openNotices:'Открытые обращения', cta:'Войдите в PowerCare, чтобы просмотреть подробности и принять меры.', footer:'Умное управление командой и задачами' },
  ja: { dir:'ltr', subject:'週間サマリー：', header:'会社の週間パフォーマンスサマリー', hello:'こんにちは。', intro:'過去7日間の', period:'のパフォーマンス概要です。', employees:'従業員', stations:'ステーション', completed:'完了タスク', tasks:'タスク', newTasks:'今週の新規タスク', active:'進行中', review:'レビュー待ち', overdue:'期限超過タスク', reports:'レポートと通知', dailyReports:'提出済み日次レポート', newNotices:'今週の新規通知', openNotices:'未解決の通知', cta:'PowerCareにログインして詳細を確認し、必要な対応を行ってください。', footer:'チームとタスクのスマート管理' },
  ko: { dir:'ltr', subject:'주간 요약:', header:'회사 주간 성과 요약', hello:'안녕하세요.', intro:'지난 7일간', period:'의 성과 요약입니다.', employees:'직원', stations:'현장', completed:'완료 작업', tasks:'작업', newTasks:'이번 주 새 작업', active:'진행 중', review:'검토 대기', overdue:'기한 초과 작업', reports:'보고서 및 알림', dailyReports:'제출된 일일 보고서', newNotices:'이번 주 새 알림', openNotices:'미해결 알림', cta:'PowerCare에 로그인하여 전체 세부정보를 확인하고 필요한 조치를 취하세요.', footer:'팀과 작업을 위한 스마트 관리' },
};
function getCopy(language) { return EMAIL_COPY[language] || EMAIL_COPY.en; }
function weeklySummaryHtml(companyName, stats, language = 'en') {
  const c = getCopy(language);
  const align = c.dir === 'rtl' ? 'right' : 'left';
  return `<!DOCTYPE html><html lang="${language}" dir="${c.dir}"><body style="margin:0;padding:0;background:#f5efe4;font-family:Arial,Tahoma,sans-serif;direction:${c.dir};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe4;padding:32px 12px;"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #eadfc9;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(76,55,28,.08);">
      <tr><td style="padding:28px;text-align:center;background:linear-gradient(180deg,#d8b578,#b8863e);"><img src="${POWERCARE_LOGO_URL}" width="74" height="74" alt="PowerCare" style="display:block;margin:0 auto 9px;" /><div style="font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:1px;color:#ffffff;">PowerCare</div><div style="margin-top:7px;font-size:13px;color:#fff8ec;">${c.header}</div></td></tr>
      <tr><td style="padding:28px 28px 12px;text-align:${align};"><h1 style="margin:0 0 8px;font-size:21px;color:#3a2f22;">${c.hello}</h1><p style="margin:0 0 22px;font-size:14px;line-height:1.8;color:#75644d;">${c.intro} <strong style="color:#3a2f22;">${escapeHtml(companyName)}</strong> ${c.period}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${metric(c.employees, stats.employees)}${metric(c.stations, stats.stations)}${metric(c.completed, stats.completedThisWeek)}</tr></table>
        <h2 style="margin:24px 0 10px;font-size:15px;color:#3a2f22;">${c.tasks}</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eadfc9;border-radius:12px;background:#fffdf9;overflow:hidden;">${detailRow(c.newTasks, stats.newThisWeek)}${detailRow(c.active, stats.active)}${detailRow(c.review, stats.pendingReview)}${detailRow(c.overdue, stats.overdue, true)}</table>
        <h2 style="margin:22px 0 10px;font-size:15px;color:#3a2f22;">${c.reports}</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eadfc9;border-radius:12px;background:#fffdf9;overflow:hidden;">${detailRow(c.dailyReports, stats.reportsThisWeek)}${detailRow(c.newNotices, stats.newComplaintsThisWeek)}${detailRow(c.openNotices, stats.openComplaints, true)}</table>
        <p style="margin:22px 0 10px;padding:14px;border-radius:10px;background:#faf6ee;font-size:13px;line-height:1.8;color:#75644d;text-align:center;">${c.cta}</p></td></tr>
      <tr><td style="padding:18px 28px 24px;border-top:1px solid #f0e8d8;text-align:center;"><p style="margin:0;font-size:12px;color:#a08c6a;">PowerCare — ${c.footer}</p></td></tr>
    </table></td></tr></table></body></html>`;
}
function weeklySummaryText(companyName, stats, language) {
  const c = getCopy(language);
  return `${c.hello}\n\n${c.intro} ${companyName} ${c.period}\n\n${c.employees}: ${stats.employees} — ${c.stations}: ${stats.stations}\n\n${c.tasks}:\n• ${c.newTasks}: ${stats.newThisWeek}\n• ${c.active}: ${stats.active}\n• ${c.review}: ${stats.pendingReview}\n• ${c.overdue}: ${stats.overdue}\n• ${c.completed}: ${stats.completedThisWeek}\n\n${c.reports}:\n• ${c.dailyReports}: ${stats.reportsThisWeek}\n• ${c.newNotices}: ${stats.newComplaintsThisWeek}\n• ${c.openNotices}: ${stats.openComplaints}\n\n${c.cta}\n\n— PowerCare`;
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
      const preview = weeklySummaryHtml('Sample Company', { employees: 12, stations: 3, completedThisWeek: 8, newThisWeek: 10, active: 6, pendingReview: 2, overdue: 1, reportsThisWeek: 5, newComplaintsThisWeek: 1, openComplaints: 2 }, body.language || 'en');
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

        const language = EMAIL_COPY[acc.emailLanguage] ? acc.emailLanguage : 'en';
        const stats = {
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
        };
        const text = weeklySummaryText(acc.name || 'Company', stats, language);
        const html = weeklySummaryHtml(acc.name || 'Company', stats, language);
        const subject = `PowerCare — ${getCopy(language).subject} ${acc.name || ''}`.trim();

        const msg = createMimeMessage();
        msg.setSender({ name: 'PowerCare', addr: 'no-reply@powercare.app' });
        msg.setRecipient(acc.ownerEmail);
        msg.setSubject(subject);
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
            subject,
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