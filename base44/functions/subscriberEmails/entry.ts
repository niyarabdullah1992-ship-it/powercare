import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createMimeMessage } from 'npm:mimetext@3.0.24';
import { POWERCARE_MARK_URL } from '../../shared/brand.ts';

// Branded HTML wrapper — gold header, clean card, bilingual-friendly.
function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function emailHtml(title, text, language = 'en') {
  const direction = language === 'ar' ? 'rtl' : 'ltr';
  const paragraphs = escapeHtml(text).split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#4a3d2c;" dir="${direction}">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
  return `<!DOCTYPE html><html lang="${language}" dir="${direction}"><body style="margin:0;padding:0;background:#F7F8FA;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;padding:32px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;"><tr><td style="background:#14284B;padding:26px;text-align:center;"><img src="${POWERCARE_MARK_URL}" width="72" height="72" alt="NiroVera" style="display:block;margin:0 auto 8px;background:#fff;border-radius:8px;" /><div style="font-size:20px;font-weight:700;color:#ffffff;font-family:Arial,Helvetica,sans-serif;letter-spacing:1px;">NiroVera</div></td></tr><tr><td style="padding:30px 30px 10px;"><h1 style="margin:0 0 16px;font-size:18px;color:#14284B;font-family:Arial,Helvetica,sans-serif;" dir="${direction}">${escapeHtml(title)}</h1>${paragraphs}</td></tr><tr><td style="padding:18px 30px 26px;border-top:1px solid #E2E8F0;"><p style="margin:0;font-size:12px;color:#5A6B85;text-align:center;">NiroVera · Smart workforce management</p></td></tr></table></td></tr></table></body></html>`;
}
const MESSAGE_COPY = {
  en:{hello:'Hello',welcome:'Welcome to PowerCare',created:'Your PowerCare account has been created successfully.',next:'You can now sign in, add your stations and team, and manage operations from one place.',confirmed:'Your PowerCare subscription is confirmed',thanks:'Thank you for subscribing to PowerCare.',trial:'Your 120-day free trial starts today. Billing begins after it ends, and you can cancel beforehand.',reminder:'Your PowerCare free trial ends soon',days:'days remaining',reminderBody:'Your free trial is nearing its end. Subscription billing will begin automatically afterward; you may change or cancel your plan before then.',team:'The PowerCare Team'},
  ar:{hello:'مرحبًا',welcome:'مرحبًا بك في PowerCare',created:'تم إنشاء حسابك في PowerCare بنجاح.',next:'يمكنك الآن تسجيل الدخول وإضافة الفروع والفريق وإدارة عملياتك من مكان واحد.',confirmed:'تم تأكيد اشتراكك في PowerCare',thanks:'شكرًا لاشتراكك في PowerCare.',trial:'تبدأ اليوم تجربتك المجانية لمدة 120 يومًا، ويبدأ التحصيل بعد انتهائها، ويمكنك الإلغاء قبل ذلك.',reminder:'تجربتك المجانية في PowerCare تنتهي قريبًا',days:'يومًا متبقيًا',reminderBody:'تقترب تجربتك المجانية من نهايتها. سيبدأ تحصيل الاشتراك تلقائيًا بعدها، ويمكنك تغيير الباقة أو إلغاؤها قبل ذلك.',team:'فريق PowerCare'},
  de:{hello:'Hallo',welcome:'Willkommen bei PowerCare',created:'Ihr PowerCare-Konto wurde erfolgreich erstellt.',next:'Sie können sich jetzt anmelden, Standorte und Team hinzufügen und Ihre Abläufe zentral verwalten.',confirmed:'Ihr PowerCare-Abonnement wurde bestätigt',thanks:'Vielen Dank für Ihr PowerCare-Abonnement.',trial:'Ihre 120-tägige kostenlose Testphase beginnt heute. Danach startet die Abrechnung; vorher können Sie kündigen.',reminder:'Ihre kostenlose PowerCare-Testphase endet bald',days:'Tage verbleiben',reminderBody:'Ihre Testphase endet bald. Danach beginnt die Abrechnung automatisch; Sie können Ihren Tarif vorher ändern oder kündigen.',team:'Das PowerCare-Team'},
  fr:{hello:'Bonjour',welcome:'Bienvenue sur PowerCare',created:'Votre compte PowerCare a été créé avec succès.',next:'Vous pouvez maintenant vous connecter, ajouter vos stations et votre équipe, puis gérer vos opérations au même endroit.',confirmed:'Votre abonnement PowerCare est confirmé',thanks:'Merci de votre abonnement à PowerCare.',trial:'Votre essai gratuit de 120 jours commence aujourd’hui. La facturation débutera ensuite; vous pouvez annuler avant.',reminder:'Votre essai gratuit PowerCare se termine bientôt',days:'jours restants',reminderBody:'Votre essai touche à sa fin. La facturation commencera automatiquement ensuite; vous pouvez modifier ou annuler votre offre avant.',team:'L’équipe PowerCare'},
  es:{hello:'Hola',welcome:'Bienvenido a PowerCare',created:'Tu cuenta de PowerCare se creó correctamente.',next:'Ya puedes iniciar sesión, añadir estaciones y equipo, y gestionar tus operaciones desde un solo lugar.',confirmed:'Tu suscripción a PowerCare está confirmada',thanks:'Gracias por suscribirte a PowerCare.',trial:'Tu prueba gratuita de 120 días comienza hoy. La facturación empezará al terminar; puedes cancelar antes.',reminder:'Tu prueba gratuita de PowerCare termina pronto',days:'días restantes',reminderBody:'Tu prueba está por finalizar. La facturación comenzará automáticamente después; puedes cambiar o cancelar tu plan antes.',team:'El equipo de PowerCare'},
  pt:{hello:'Olá',welcome:'Bem-vindo ao PowerCare',created:'Sua conta PowerCare foi criada com sucesso.',next:'Agora você pode entrar, adicionar estações e equipe e gerenciar suas operações em um só lugar.',confirmed:'Sua assinatura PowerCare foi confirmada',thanks:'Obrigado por assinar o PowerCare.',trial:'Seu teste grátis de 120 dias começa hoje. A cobrança começa depois; você pode cancelar antes.',reminder:'Seu teste grátis do PowerCare termina em breve',days:'dias restantes',reminderBody:'Seu teste está próximo do fim. A cobrança começará automaticamente depois; você pode alterar ou cancelar o plano antes.',team:'Equipe PowerCare'},
  ru:{hello:'Здравствуйте',welcome:'Добро пожаловать в PowerCare',created:'Ваша учётная запись PowerCare успешно создана.',next:'Теперь вы можете войти, добавить станции и команду и управлять работой в одном месте.',confirmed:'Подписка PowerCare подтверждена',thanks:'Спасибо за подписку на PowerCare.',trial:'Сегодня начинается бесплатный 120-дневный период. После него начнётся оплата; до этого можно отменить подписку.',reminder:'Пробный период PowerCare скоро закончится',days:'дней осталось',reminderBody:'Пробный период подходит к концу. Затем автоматически начнётся оплата; до этого можно изменить или отменить тариф.',team:'Команда PowerCare'},
  ja:{hello:'こんにちは',welcome:'PowerCareへようこそ',created:'PowerCareアカウントが正常に作成されました。',next:'ログインしてステーションとチームを追加し、業務を一元管理できます。',confirmed:'PowerCareのサブスクリプションが確認されました',thanks:'PowerCareをご利用いただきありがとうございます。',trial:'本日から120日間の無料トライアルが始まります。終了後に課金が開始され、事前にキャンセルできます。',reminder:'PowerCare無料トライアル終了のお知らせ',days:'日残っています',reminderBody:'無料トライアルの終了が近づいています。終了後は自動的に課金が始まりますが、事前にプラン変更またはキャンセルできます。',team:'PowerCareチーム'},
  ko:{hello:'안녕하세요',welcome:'PowerCare에 오신 것을 환영합니다',created:'PowerCare 계정이 성공적으로 생성되었습니다.',next:'이제 로그인하여 현장과 팀을 추가하고 모든 운영을 한 곳에서 관리할 수 있습니다.',confirmed:'PowerCare 구독이 확인되었습니다',thanks:'PowerCare를 구독해 주셔서 감사합니다.',trial:'오늘부터 120일 무료 체험이 시작됩니다. 종료 후 결제가 시작되며 그 전에 취소할 수 있습니다.',reminder:'PowerCare 무료 체험이 곧 종료됩니다',days:'일 남음',reminderBody:'무료 체험 종료가 다가오고 있습니다. 이후 자동 결제가 시작되며 그 전에 요금제를 변경하거나 취소할 수 있습니다.',team:'PowerCare 팀'},
};
function copyFor(language) { return MESSAGE_COPY[language] || MESSAGE_COPY.en; }
function localizedMessage(type, language, companyName, plan, daysLeft) {
  const c = copyFor(language);
  if (type === 'welcome') return { subject:`${c.welcome}${companyName ? ` — ${companyName}` : ''}`, body:`${c.hello},\n\n${c.created}${companyName ? ` (${companyName})` : ''}\n\n${c.next}\n\n— ${c.team}` };
  if (type === 'confirmed') return { subject:`${c.confirmed}${plan ? ` — ${plan}` : ''}`, body:`${c.hello},\n\n${c.thanks}${companyName ? ` (${companyName})` : ''}\n\n${c.trial}\n\n— ${c.team}` };
  return { subject:`${c.reminder} — ${daysLeft} ${c.days}`, body:`${c.hello},\n\n${companyName}\n\n${c.reminderBody}\n\n${daysLeft} ${c.days}.\n\n— ${c.team}` };
}

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

    // Sends a branded HTML email via the connected Gmail account, falling back to
    // the built-in email service (plain text) if Gmail is unavailable.
    const send = async (to, subject, emailBody, language = 'en') => {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
        const msg = createMimeMessage();
        msg.setSender({ name: 'PowerCare', addr: 'no-reply@powercare.app' });
        msg.setRecipient(to);
        msg.setSubject(subject);
        msg.addMessage({ contentType: 'text/html', data: emailHtml(subject, emailBody, language) });
        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: toBase64Url(msg.asRaw()) }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error?.message || `Gmail send failed (${res.status})`);
        }
        return;
      } catch (gmailError) {
        console.error('Gmail send failed, falling back to Core.SendEmail:', gmailError.message);
        await base44.asServiceRole.integrations.Core.SendEmail({
          to, subject, body: emailBody, from_name: 'PowerCare',
        });
      }
    };

    if (action === 'welcome' || action === 'paymentConfirmed') {
      // Not public: requires a valid session for the company, and the recipient +
      // company name + plan are read from the server-stored account record —
      // never from the request body (blocks spoofed/phishing content injection).
      const { companyId, sessionToken } = body;
      const user = await base44.auth.me().catch(() => null);
      let authed = !!(user && user.role === 'admin');
      if (!authed && companyId && sessionToken) {
        const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: sessionToken, companyId });
        const s = sessions[0];
        authed = !!(s && new Date(s.expiresAt).getTime() > Date.now());
      }
      if (!authed) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const accounts = await base44.asServiceRole.entities.CompanyAccount.filter({ companyId });
      const acc = accounts[0];
      if (!acc?.ownerEmail) return Response.json({ error: 'Account not found' }, { status: 404 });
      const companyName = String(acc.name || '').replace(/[\r\n]/g, ' ').slice(0, 120);
      const language = MESSAGE_COPY[acc.emailLanguage] ? acc.emailLanguage : 'en';
      if (action === 'welcome') {
        const message = localizedMessage('welcome', language, companyName, '', 0);
        await send(acc.ownerEmail, message.subject, message.body, language);
      } else {
        const plan = String(acc.plan || '').replace(/[\r\n]/g, ' ').slice(0, 40);
        const message = localizedMessage('confirmed', language, companyName, plan, 0);
        await send(acc.ownerEmail, message.subject, message.body, language);
      }
      return Response.json({ ok: true });
    }

    // Admin-only actions below (platform owner or scheduled workflow).
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'manualUpgrade') {
      const account = body.accountId
        ? await base44.asServiceRole.entities.CompanyAccount.get(String(body.accountId)).catch(() => null)
        : null;
      if (!account?.companyId || !account.ownerEmail) return Response.json({ error: 'Account not found' }, { status: 404 });
      const language = MESSAGE_COPY[account.emailLanguage] ? account.emailLanguage : 'en';
      const plan = String(account.plan || '').replace(/[\r\n]/g, ' ').slice(0, 40);
      const companyName = String(account.name || '').replace(/[\r\n]/g, ' ').slice(0, 120);
      const isArabic = language === 'ar';
      const subject = isArabic ? `تهانينا بترقية حسابك إلى ${plan}` : `Congratulations on your upgrade to ${plan}`;
      const messageText = isArabic
        ? `مرحبًا،\n\nتهانينا! تمت ترقية حساب شركة ${companyName} بنجاح إلى باقة ${plan}. أصبحت مزايا الباقة الجديدة متاحة الآن داخل PowerCare.\n\n— فريق PowerCare`
        : `Hello,\n\nCongratulations! ${companyName} has been successfully upgraded to the ${plan} plan. Your new plan features are now available in PowerCare.\n\n— The PowerCare Team`;
      const metaRows = await base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId: account.companyId, category: 'companyMeta' });
      const ownerId = metaRows[0]?.payload?.[0]?.ownerId || null;
      const employees = ownerId ? [] : await base44.asServiceRole.entities.Employee.filter({ companyId: account.companyId });
      const recipientId = ownerId || employees.find((employee) => employee.role === 'director')?.employeeId || null;
      if (recipientId) {
        const notificationRows = await base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId: account.companyId, category: 'notifications' });
        const notification = { id: crypto.randomUUID(), userId: recipientId, text: subject, read: false, createdAt: new Date().toISOString() };
        if (notificationRows[0]) await base44.asServiceRole.entities.CompanyDataBlob.update(notificationRows[0].id, { payload: [notification, ...(notificationRows[0].payload || [])] });
        else await base44.asServiceRole.entities.CompanyDataBlob.create({ companyId: account.companyId, category: 'notifications', payload: [notification] });
      }
      await send(account.ownerEmail, subject, messageText, language);
      return Response.json({ ok: true, emailSent: true, notificationCreated: !!recipientId });
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
          const language = MESSAGE_COPY[acc.emailLanguage] ? acc.emailLanguage : 'en';
          const message = localizedMessage('reminder', language, acc.name || 'PowerCare', acc.plan || '', daysLeft);
          await send(acc.ownerEmail, message.subject, message.body, language);
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