import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Company-scoped Employee/Station access. Runs with the service role only —
// the Employee/Station entities themselves are locked down (no public RLS),
// so this function is the sole gateway and always filters by companyId,
// preventing one company from ever reading or writing another's records.
// Passwords are stored as slow PBKDF2 hashes; legacy SHA-256 hashes are upgraded after a valid login. Plaintext is never stored.
async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function hashPassword(password, salt) {
  const s = salt || crypto.randomUUID().replace(/-/g, '');
  const hex = await sha256Hex(s + '::' + password);
  return `sha256$${s}$${hex}`;
}
async function pbkdf2Password(password, salt, iterations = 210000) {
  const s = salt || crypto.randomUUID().replace(/-/g, '');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(s), iterations },
    key, 256,
  );
  const hex = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2$${iterations}$${s}$${hex}`;
}
async function verifyPassword(password, stored) {
  if (!stored) return false;
  if (String(stored).startsWith('pbkdf2$')) {
    const [, rounds, salt] = String(stored).split('$');
    return (await pbkdf2Password(password, salt, Number(rounds))) === stored;
  }
  if (String(stored).startsWith('sha256$')) {
    const salt = String(stored).split('$')[1];
    return (await hashPassword(password, salt)) === stored;
  }
  return stored === password;
}

/* ----- login OTP (email second factor) ----- */
const OTP_TTL_MS = 10 * 60 * 1000;
async function createLoginOtp(base44, { kind, companyId, employeeId, email }) {
  const oldCodes = await base44.asServiceRole.entities.LoginOtp.filter({ email });
  for (const old of oldCodes) await base44.asServiceRole.entities.LoginOtp.delete(old.id);
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  const code = String(100000 + (random[0] % 900000));
  const pendingId = crypto.randomUUID();
  await base44.asServiceRole.entities.LoginOtp.create({
    pendingId, kind, companyId, employeeId: employeeId || null, email,
    codeHash: await sha256Hex(pendingId + '::' + code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(), attempts: 0,
  });
  await base44.asServiceRole.integrations.Core.SendEmail({
    to: email,
    from_name: 'PowerCare',
    subject: 'PowerCare — رمز التحقق لتسجيل الدخول / Login Verification Code',
    body: `رمز التحقق الخاص بك هو: ${code}\n\nYour verification code is: ${code}\n\nصالح لمدة 10 دقائق. إذا لم تحاول تسجيل الدخول، تجاهل هذه الرسالة.\nValid for 10 minutes. If you didn't try to log in, ignore this email.`,
  });
  return pendingId;
}

/* ----- session-based authorization ----- */
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;
async function makeSession(base44, companyId, userId, role) {
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  await base44.asServiceRole.entities.CompanySession.create({
    companyId, token, userId: userId || null, role,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  });
  return token;
}
// Validates the caller: either the platform builder (Base44 admin) or a valid
// session token for this specific company — issued only at a successful login.
async function getAuth(base44, body) {
  const user = await base44.auth.me().catch(() => null);
  if (user && user.role === 'admin') return { role: 'owner', admin: true };
  const { sessionToken, companyId } = body;
  if (!sessionToken || !companyId) return null;
  const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: sessionToken, companyId });
  const s = sessions[0];
  if (!s || new Date(s.expiresAt).getTime() < Date.now()) return null;
  return { role: s.role, userId: s.userId };
}

/* ----- realtime change signal ----- */
// Bumps a tiny public counter after every write so other open devices get an
// instant realtime event and pull the changes immediately (instead of waiting
// for the next poll). The signal carries no data beyond companyId + version.
async function bumpSignal(base44, companyId) {
  try {
    const existing = await base44.asServiceRole.entities.SyncSignal.filter({ companyId });
    if (existing.length) {
      await base44.asServiceRole.entities.SyncSignal.update(existing[0].id, { version: (existing[0].version || 0) + 1 });
    } else {
      await base44.asServiceRole.entities.SyncSignal.create({ companyId, version: 1 });
    }
  } catch (e) {
    console.error('bumpSignal failed:', e.message);
  }
}

/* ----- delta sync ----- */
// Upserts a collection by diff: creates new records, updates only changed ones and
// deletes removed ones — instead of wiping and re-inserting everything on every sync.
async function diffSync(entity, current, incoming, key) {
  const seen = new Set();
  const toDelete = [];
  const currentByKey = new Map();
  for (const r of current) {
    if (seen.has(r[key])) { toDelete.push(r.id); continue; } // stray duplicate
    seen.add(r[key]);
    currentByKey.set(r[key], r);
  }
  const incomingKeys = new Set(incoming.map((r) => r[key]));
  const toCreate = [];
  const toUpdate = [];
  for (const rec of incoming) {
    const existing = currentByKey.get(rec[key]);
    if (!existing) { toCreate.push(rec); continue; }
    const changed = Object.keys(rec).some((k) => JSON.stringify(rec[k] ?? null) !== JSON.stringify(existing[k] ?? null));
    if (changed) toUpdate.push({ id: existing.id, ...rec });
  }
  for (const [k, r] of currentByKey) if (!incomingKeys.has(k)) toDelete.push(r.id);
  // Deletion-only changes must still bump a version stamp so other devices notice.
  if (!toCreate.length && !toUpdate.length && toDelete.length && incoming.length) {
    const survivor = currentByKey.get(incoming[0][key]);
    if (survivor) toUpdate.push({ id: survivor.id, ...incoming[0] });
  }
  if (toCreate.length) await entity.bulkCreate(toCreate);
  if (toUpdate.length) await entity.bulkUpdate(toUpdate);
  for (const id of toDelete) await entity.delete(id);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, companyId } = body;

    // Cross-device login lookup — doesn't need a companyId yet, since the caller is
    // trying to discover which company an email/password combination belongs to.
    if (action === 'findAccountByEmail') {
      const { email, password } = body;
      if (!email || !password) return Response.json({ error: 'Missing credentials' }, { status: 400 });
      const all = await base44.asServiceRole.entities.CompanyAccount.list();
      let found = null;
      for (const c of all) {
        if (c.ownerEmail.toLowerCase() !== String(email).toLowerCase()) continue;
        if (await verifyPassword(password, c.ownerPassword)) { found = c; break; }
      }
      if (!found) return Response.json({ company: null });
      // Upgrade legacy plaintext/SHA-256 records to slow PBKDF2 after a valid login.
      if (!String(found.ownerPassword).startsWith('pbkdf2$')) {
        await base44.asServiceRole.entities.CompanyAccount.update(found.id, { ownerPassword: await pbkdf2Password(password) });
      }
      // Password verified — second factor: email a one-time code instead of issuing a session.
      const pendingId = await createLoginOtp(base44, { kind: 'owner', companyId: found.companyId, email: found.ownerEmail });
      return Response.json({ otpRequired: true, pendingId });
    }

    // Per-employee login — each employee signs in with their own email + personal password.
    if (action === 'employeeLogin') {
      const { email, password } = body;
      if (!email || !password) return Response.json({ error: 'Missing credentials' }, { status: 400 });
      const creds = await base44.asServiceRole.entities.EmployeeCredential.filter({ email: String(email).toLowerCase() });
      let match = null;
      for (const c of creds) {
        if (await verifyPassword(password, c.passwordHash)) { match = c; break; }
      }
      if (!match) return Response.json({ employee: null });
      // Password verified — second factor: email a one-time code instead of issuing a session.
      const pendingId = await createLoginOtp(base44, { kind: 'employee', companyId: match.companyId, employeeId: match.employeeId, email: match.email });
      return Response.json({ otpRequired: true, pendingId });
    }

    // Secure owner password recovery: requesting a reset never reveals whether an email exists.
    if (action === 'requestOwnerPasswordReset') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) return Response.json({ error: 'Missing email' }, { status: 400 });
      const accounts = await base44.asServiceRole.entities.CompanyAccount.list();
      const account = accounts.find((item) => String(item.ownerEmail || '').trim().toLowerCase() === email);
      const pendingId = account
        ? await createLoginOtp(base44, { kind: 'owner_reset', companyId: account.companyId, email: account.ownerEmail })
        : crypto.randomUUID();
      return Response.json({ ok: true, pendingId });
    }

    if (action === 'resetOwnerPassword') {
      const { pendingId, code, newPassword } = body;
      if (!pendingId || !code || String(newPassword || '').length < 6) return Response.json({ error: 'Invalid fields' }, { status: 400 });
      const recs = await base44.asServiceRole.entities.LoginOtp.filter({ pendingId });
      const rec = recs[0];
      if (!rec || rec.kind !== 'owner_reset' || new Date(rec.expiresAt).getTime() < Date.now() || (rec.attempts || 0) >= 5) {
        return Response.json({ error: 'invalid_or_expired' }, { status: 401 });
      }
      const codeHash = await sha256Hex(pendingId + '::' + String(code).trim());
      if (codeHash !== rec.codeHash) {
        await base44.asServiceRole.entities.LoginOtp.update(rec.id, { attempts: (rec.attempts || 0) + 1 });
        return Response.json({ error: 'invalid_code' }, { status: 401 });
      }
      const accounts = await base44.asServiceRole.entities.CompanyAccount.filter({ companyId: rec.companyId });
      if (!accounts[0]) return Response.json({ error: 'Account not found' }, { status: 404 });
      await base44.asServiceRole.entities.CompanyAccount.update(accounts[0].id, { ownerPassword: await pbkdf2Password(String(newPassword)) });
      await base44.asServiceRole.entities.LoginOtp.delete(rec.id);
      return Response.json({ ok: true });
    }

    // Second login step — verifies the emailed code and only then issues the session.
    if (action === 'verifyLoginOtp') {
      const { pendingId, code } = body;
      if (!pendingId || !code) return Response.json({ error: 'Missing fields' }, { status: 400 });
      const recs = await base44.asServiceRole.entities.LoginOtp.filter({ pendingId });
      const rec = recs[0];
      if (!rec || new Date(rec.expiresAt).getTime() < Date.now()) {
        return Response.json({ error: 'expired' }, { status: 401 });
      }
      if ((rec.attempts || 0) >= 5) return Response.json({ error: 'too_many_attempts' }, { status: 401 });
      const hash = await sha256Hex(pendingId + '::' + String(code).trim());
      if (hash !== rec.codeHash) {
        await base44.asServiceRole.entities.LoginOtp.update(rec.id, { attempts: (rec.attempts || 0) + 1 });
        return Response.json({ error: 'invalid_code' }, { status: 401 });
      }
      await base44.asServiceRole.entities.LoginOtp.delete(rec.id);
      const accounts = await base44.asServiceRole.entities.CompanyAccount.filter({ companyId: rec.companyId });
      const acc = accounts[0] || {};
      if (rec.kind === 'owner') {
        const { ownerPassword: _pw2, ...safe } = acc;
        const token = await makeSession(base44, rec.companyId, null, 'owner');
        return Response.json({ kind: 'owner', company: safe, token });
      }
      const token = await makeSession(base44, rec.companyId, rec.employeeId, 'employee');
      return Response.json({
        kind: 'employee', token,
        employee: { companyId: rec.companyId, employeeId: rec.employeeId },
        company: { companyId: rec.companyId, name: acc.name || '', plan: acc.plan || '', allowedEmailDomain: acc.allowedEmailDomain || '', ownerEmail: acc.ownerEmail || '' },
      });
    }

    if (!companyId) return Response.json({ error: 'Missing companyId' }, { status: 400 });

    /* ----- server-side authorization for all company-scoped actions ----- */
    const auth = await getAuth(base44, body);

    if (action === 'syncAccount') {
      const { name, ownerEmail, ownerPassword, plan, allowedEmailDomain } = body;
      const existing = await base44.asServiceRole.entities.CompanyAccount.filter({ companyId });
      // Existing accounts may only be modified by their owner (or the platform builder).
      if (existing.length && (!auth || auth.role !== 'owner')) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Always store a slow PBKDF2 hash; keep the existing hash if no password was sent.
      let storedPassword = ownerPassword;
      if (storedPassword && !String(storedPassword).startsWith('pbkdf2$')) {
        storedPassword = await pbkdf2Password(storedPassword);
      } else if (!storedPassword && existing.length) {
        storedPassword = existing[0].ownerPassword;
      }
      const fields = { companyId, name, ownerEmail, ownerPassword: storedPassword, plan, allowedEmailDomain: allowedEmailDomain || '' };
      let token = null;
      if (existing.length) {
        await base44.asServiceRole.entities.CompanyAccount.update(existing[0].id, fields);
      } else {
        await base44.asServiceRole.entities.CompanyAccount.create(fields);
        // Brand-new signup — issue the creator an owner session immediately.
        token = await makeSession(base44, companyId, null, 'owner');
      }
      return Response.json({ ok: true, token });
    }

    if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (action === 'revokeSession') {
      const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: body.sessionToken, companyId });
      for (const session of sessions) await base44.asServiceRole.entities.CompanySession.delete(session.id);
      return Response.json({ ok: true });
    }

    // Employee account deletion is reserved for assigned HR staff. It also revokes
    // credentials and active sessions so the removed employee cannot sign in again.
    if (action === 'deleteEmployeeAccount') {
      const { employeeId } = body;
      if (!employeeId || !auth.userId || auth.userId === employeeId) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const actors = await base44.asServiceRole.entities.Employee.filter({ companyId, employeeId: auth.userId });
      if (!actors[0]?.hrLevelId) return Response.json({ error: 'HR access required' }, { status: 403 });
      const targets = await base44.asServiceRole.entities.Employee.filter({ companyId, employeeId });
      if (!targets.length) return Response.json({ error: 'Employee not found' }, { status: 404 });
      const meta = await base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId, category: 'companyMeta' });
      if (meta[0]?.payload?.[0]?.ownerId === employeeId) return Response.json({ error: 'Company owner cannot be deleted' }, { status: 403 });
      const credentials = await base44.asServiceRole.entities.EmployeeCredential.filter({ companyId, employeeId });
      const sessions = await base44.asServiceRole.entities.CompanySession.filter({ companyId, userId: employeeId });
      for (const record of credentials) await base44.asServiceRole.entities.EmployeeCredential.delete(record.id);
      for (const session of sessions) await base44.asServiceRole.entities.CompanySession.delete(session.id);
      for (const target of targets) await base44.asServiceRole.entities.Employee.delete(target.id);
      await base44.asServiceRole.entities.AuditLog.create({ companyId, action: 'employee_account_deleted', performedBy: actors[0].name || 'HR', details: `Employee account deleted: ${targets[0].name || employeeId}.` });
      await bumpSignal(base44, companyId);
      return Response.json({ ok: true });
    }

    // Password changes: allowed for the owner, or for an employee changing their OWN password.
    if (action === 'setEmployeePassword' && auth.role !== 'owner' && auth.userId !== body.employeeId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Sets (or resets) an employee's personal login password — always stored hashed.
    if (action === 'setEmployeePassword') {
      const { employeeId, email, password } = body;
      if (!employeeId || !email || !password) return Response.json({ error: 'Missing fields' }, { status: 400 });
      const stored = await pbkdf2Password(password);
      const fields = { companyId, employeeId, email: String(email).toLowerCase(), passwordHash: stored };
      const existing = await base44.asServiceRole.entities.EmployeeCredential.filter({ companyId, employeeId });
      if (existing.length) {
        await base44.asServiceRole.entities.EmployeeCredential.update(existing[0].id, fields);
      } else {
        await base44.asServiceRole.entities.EmployeeCredential.create(fields);
      }
      return Response.json({ ok: true });
    }

    if (action === 'syncEmployees') {
      const { employees } = body;
      const incoming = (Array.isArray(employees) ? employees : []).map(({ id, ...rest }) => ({ ...rest, employeeId: id, companyId }));
      const current = await base44.asServiceRole.entities.Employee.filter({ companyId });
      await diffSync(base44.asServiceRole.entities.Employee, current, incoming, 'employeeId');
      await bumpSignal(base44, companyId);
      return Response.json({ ok: true });
    }

    if (action === 'getEmployees') {
      const records = await base44.asServiceRole.entities.Employee.filter({ companyId });
      return Response.json({ employees: records });
    }

    if (action === 'syncStations') {
      const { stations } = body;
      const incoming = (Array.isArray(stations) ? stations : []).map(({ id, ...rest }) => ({ ...rest, stationId: id, companyId }));
      const current = await base44.asServiceRole.entities.Station.filter({ companyId });
      await diffSync(base44.asServiceRole.entities.Station, current, incoming, 'stationId');
      await bumpSignal(base44, companyId);
      return Response.json({ ok: true });
    }

    // Lightweight change detection — returns a per-collection version stamp so clients
    // can skip downloading collections that haven't changed since their last pull.
    if (action === 'getVersions') {
      const [emp, st, blobs] = await Promise.all([
        base44.asServiceRole.entities.Employee.filter({ companyId }, '-updated_date', 1),
        base44.asServiceRole.entities.Station.filter({ companyId }, '-updated_date', 1),
        base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId }),
      ]);
      const versions = {
        employees: emp[0]?.updated_date || null,
        stations: st[0]?.updated_date || null,
      };
      for (const b of blobs) versions['blob:' + b.category] = b.updated_date || null;
      return Response.json({ versions });
    }

    if (action === 'getStations') {
      const records = await base44.asServiceRole.entities.Station.filter({ companyId });
      return Response.json({ stations: records });
    }

    if (action === 'syncBlob') {
      const { category, payload } = body;
      if (!category) return Response.json({ error: 'Missing category' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId, category });
      const data = Array.isArray(payload) ? payload : [];
      if (existing.length) {
        await base44.asServiceRole.entities.CompanyDataBlob.update(existing[0].id, { payload: data });
        for (const extra of existing.slice(1)) {
          await base44.asServiceRole.entities.CompanyDataBlob.delete(extra.id);
        }
      } else {
        await base44.asServiceRole.entities.CompanyDataBlob.create({ companyId, category, payload: data });
      }
      await bumpSignal(base44, companyId);
      return Response.json({ ok: true });
    }

    if (action === 'getBlob') {
      const { category } = body;
      if (!category) return Response.json({ error: 'Missing category' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId, category });
      return Response.json({ payload: existing[0]?.payload || [] });
    }

    // Owner-only permanent purge: removes the company account and every related
    // record — employees, stations, data blobs, credentials, sessions and signal.
    if (action === 'deleteCompanyAccount') {
      if (auth.role !== 'owner') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const svc = base44.asServiceRole.entities;
      const wipe = async (entity) => {
        const records = await entity.filter({ companyId });
        for (const r of records) await entity.delete(r.id);
      };
      try {
        await wipe(svc.Employee);
        await wipe(svc.Station);
        await wipe(svc.CompanyDataBlob);
        await wipe(svc.EmployeeCredential);
        await wipe(svc.CompanySession);
        await wipe(svc.SyncSignal);
        await wipe(svc.CompanyAccount);
        await svc.AuditLog.create({
          companyId, action: 'company_deleted',
          performedBy: body.performedBy || 'owner',
          details: 'Company account permanently deleted by owner (all stations, employees and data blobs purged).',
        });
      } catch (e) {
        console.error('deleteCompanyAccount failed:', e.message);
        return Response.json({ error: e.message }, { status: 500 });
      }
      return Response.json({ ok: true });
    }

    if (action === 'logAudit') {
      const { auditAction, performedBy, details } = body;
      await base44.asServiceRole.entities.AuditLog.create({
        companyId, action: auditAction || 'unknown', performedBy: performedBy || 'unknown', details: details || '',
      });
      return Response.json({ ok: true });
    }

    if (action === 'getAuditLog') {
      const records = await base44.asServiceRole.entities.AuditLog.filter({ companyId }, '-created_date', 100);
      return Response.json({ logs: records });
    }

    if (action === 'getAllAuditLog') {
      // platform-wide log — only the platform owner (admin role) may view every company's entries.
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const records = await base44.asServiceRole.entities.AuditLog.list('-created_date', 200);
      return Response.json({ logs: records });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});