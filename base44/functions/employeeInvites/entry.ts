// Employee invite gateway: HR creates 7-day invite codes, the employee accepts
// and sets a password, and the account only activates after HR approval links it
// to a job seat. Every step is written to the audit trail.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { authPowerCareSession } from '../../shared/powerCareSession.ts';
import { sha256Hex, pbkdf2Password } from '../../shared/passwords.ts';
import { sendSystemEmail, brandedEmailHtml } from '../../shared/systemEmail.ts';

const INVITE_TTL_MS = 7 * 24 * 3600 * 1000;
const safeInvite = ({ tokenHash: _t, passwordHash: _p, ...rest }) => rest;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, companyId } = body;
    if (!companyId) return Response.json({ error: 'Missing companyId' }, { status: 400 });
    const svc = base44.asServiceRole.entities;
    const audit = async (auditAction, performedBy, details) => {
      try {
        await svc.AuditLog.create({ companyId, action: auditAction, performedBy: String(performedBy || 'unknown').slice(0, 100), details: String(details || '').slice(0, 1000) });
      } catch (e) { console.error('invite audit failed:', e.message); }
    };

    // Public step — the invited employee proves the token and sets their password.
    if (action === 'accept') {
      const token = String(body.token || '').trim();
      const password = String(body.password || '');
      if (!token || password.length < 6) return Response.json({ error: 'invalid_fields' }, { status: 400 });
      const tokenHash = await sha256Hex(token);
      const invites = await svc.EmployeeInvite.filter({ companyId, tokenHash });
      const invite = invites[0];
      if (!invite || invite.status === 'revoked') return Response.json({ error: 'invalid_invite' }, { status: 404 });
      if (new Date(invite.expiresAt).getTime() < Date.now()) return Response.json({ error: 'expired' }, { status: 410 });
      if (invite.status !== 'pending') return Response.json({ error: 'already_used' }, { status: 409 });
      const email = String(body.email || invite.email || '').trim().toLowerCase();
      if (!email) return Response.json({ error: 'email_required' }, { status: 400 });
      await svc.EmployeeInvite.update(invite.id, {
        status: 'awaiting_approval', email,
        passwordHash: await pbkdf2Password(password),
        acceptedAt: new Date().toISOString(),
      });
      await audit('invite_accepted', invite.name, `الموظف ${invite.name} (${invite.jobNumber}) قَبِل الدعوة وضبط كلمة المرور — بانتظار اعتماد الموارد البشرية.`);
      return Response.json({ ok: true, name: invite.name });
    }

    // Everything below requires an authorized HR/owner session.
    const auth = await authPowerCareSession(base44, companyId, body.sessionToken);
    if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const canManage = auth.admin || auth.owner || auth.role === 'owner' || ['director', 'ops_manager'].includes(auth.role) || !!auth.hrLevelId;
    if (!canManage) return Response.json({ error: 'Forbidden: HR access required' }, { status: 403 });

    if (action === 'create') {
      const name = String(body.name || '').trim();
      const jobNumber = String(body.jobNumber || '').trim();
      const phone = String(body.phone || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      if (!name || !jobNumber) return Response.json({ error: 'name_and_jobNumber_required' }, { status: 400 });
      const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      const invite = {
        companyId, inviteId: 'inv_' + crypto.randomUUID().replace(/-/g, '').slice(0, 10),
        name, jobNumber, phone, email,
        tokenHash: await sha256Hex(token), passwordHash: null,
        status: 'pending', expiresAt: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
        acceptedAt: null, approvedBy: null, approvedAt: null, seatId: null, employeeId: null,
        createdBy: auth.name || 'HR',
      };
      const created = await svc.EmployeeInvite.create(invite);
      const inviteUrl = `${String(body.appUrl || '').replace(/\/$/, '')}/invite?c=${encodeURIComponent(companyId)}&token=${token}`;
      let emailSent = false;
      if (email) {
        try {
          await sendSystemEmail(base44, {
            to: email,
            subject: 'PowerCare — دعوة انضمام',
            body: `مرحبًا ${name}، تمت دعوتك للانضمام إلى فريق العمل في PowerCare. افتح الرابط التالي لضبط كلمة المرور (صالح 7 أيام):\n\n${inviteUrl}`,
            html: brandedEmailHtml({
              title: 'دعوة انضمام',
              lines: [`مرحبًا ${name}،`, 'تمت دعوتك للانضمام إلى فريق العمل. اضغط الزر لضبط كلمة المرور وإكمال تسجيلك. الدعوة صالحة لمدة 7 أيام.'],
              linkUrl: inviteUrl, linkLabel: 'قبول الدعوة',
              footerNote: 'لن يُفعَّل حسابك إلا بعد اعتماد الموارد البشرية وربطك بمقعد وظيفي.',
            }),
          });
          emailSent = true;
        } catch (e) { console.error('invite email failed:', e.message); }
      }
      await audit('invite_created', auth.name, `دعوة جديدة للموظف ${name} (رقم وظيفي ${jobNumber}) صالحة حتى ${invite.expiresAt}.`);
      return Response.json({ ok: true, invite: safeInvite({ ...invite, id: created.id }), inviteUrl, emailSent });
    }

    if (action === 'list') {
      const rows = await svc.EmployeeInvite.filter({ companyId }, '-created_date', 200);
      return Response.json({ invites: rows.map(safeInvite) });
    }

    if (action === 'revoke') {
      const rows = await svc.EmployeeInvite.filter({ companyId, inviteId: String(body.inviteId || '') });
      const invite = rows[0];
      if (!invite) return Response.json({ error: 'not_found' }, { status: 404 });
      await svc.EmployeeInvite.update(invite.id, { status: 'revoked', passwordHash: null });
      await audit('invite_revoked', auth.name, `تم إلغاء دعوة الموظف ${invite.name} (${invite.jobNumber}).`);
      return Response.json({ ok: true });
    }

    // HR approval: activates the account by creating the login credential from
    // the password the employee set at accept, and records the seat linkage.
    if (action === 'approve') {
      const { inviteId, employeeId, seatId } = body;
      if (!inviteId || !employeeId) return Response.json({ error: 'missing_fields' }, { status: 400 });
      const rows = await svc.EmployeeInvite.filter({ companyId, inviteId });
      const invite = rows[0];
      if (!invite) return Response.json({ error: 'not_found' }, { status: 404 });
      if (invite.status !== 'awaiting_approval' || !invite.passwordHash || !invite.email) {
        return Response.json({ error: 'invite_not_ready' }, { status: 409 });
      }
      const fields = { companyId, employeeId, email: invite.email, passwordHash: invite.passwordHash };
      const existing = await svc.EmployeeCredential.filter({ companyId, employeeId });
      if (existing.length) await svc.EmployeeCredential.update(existing[0].id, fields);
      else await svc.EmployeeCredential.create(fields);
      await svc.EmployeeInvite.update(invite.id, {
        status: 'approved', approvedBy: auth.name || 'HR', approvedAt: new Date().toISOString(),
        seatId: seatId || null, employeeId, passwordHash: null,
      });
      await audit('invite_approved', auth.name, `تم اعتماد حساب الموظف ${invite.name} (${invite.jobNumber}) وربطه بالمقعد ${seatId || '—'} وتفعيل الدخول.`);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('employeeInvites error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});