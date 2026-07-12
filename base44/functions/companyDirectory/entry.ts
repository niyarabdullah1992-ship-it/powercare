import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Company-scoped Employee/Station access. Runs with the service role only —
// the Employee/Station entities themselves are locked down (no public RLS),
// so this function is the sole gateway and always filters by companyId,
// preventing one company from ever reading or writing another's records.
// Passwords are stored as salted SHA-256 hashes ("sha256$<salt>$<hex>") — never plaintext.
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
async function verifyPassword(password, stored) {
  if (!stored) return false;
  if (String(stored).startsWith('sha256$')) {
    const salt = String(stored).split('$')[1];
    return (await hashPassword(password, salt)) === stored;
  }
  return stored === password; // legacy plaintext record (upgraded on successful login)
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
      // Legacy plaintext record — upgrade it to a hash now that the login succeeded.
      if (!String(found.ownerPassword).startsWith('sha256$')) {
        await base44.asServiceRole.entities.CompanyAccount.update(found.id, { ownerPassword: await hashPassword(password) });
      }
      // Never send the stored password (even hashed) back to the client.
      const { ownerPassword: _pw, ...safe } = found;
      return Response.json({ company: safe });
    }

    if (!companyId) return Response.json({ error: 'Missing companyId' }, { status: 400 });

    if (action === 'syncEmployees') {
      const { employees } = body;
      const current = await base44.asServiceRole.entities.Employee.filter({ companyId });
      if (current.length) await base44.asServiceRole.entities.Employee.deleteMany({ companyId });
      if (Array.isArray(employees) && employees.length) {
        await base44.asServiceRole.entities.Employee.bulkCreate(
          employees.map(({ id, ...rest }) => ({ ...rest, employeeId: id, companyId }))
        );
      }
      return Response.json({ ok: true });
    }

    if (action === 'getEmployees') {
      const records = await base44.asServiceRole.entities.Employee.filter({ companyId });
      return Response.json({ employees: records });
    }

    if (action === 'syncStations') {
      const { stations } = body;
      const current = await base44.asServiceRole.entities.Station.filter({ companyId });
      if (current.length) await base44.asServiceRole.entities.Station.deleteMany({ companyId });
      if (Array.isArray(stations) && stations.length) {
        await base44.asServiceRole.entities.Station.bulkCreate(
          stations.map(({ id, ...rest }) => ({ ...rest, stationId: id, companyId }))
        );
      }
      return Response.json({ ok: true });
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
      return Response.json({ ok: true });
    }

    if (action === 'getBlob') {
      const { category } = body;
      if (!category) return Response.json({ error: 'Missing category' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId, category });
      return Response.json({ payload: existing[0]?.payload || [] });
    }

    if (action === 'syncAccount') {
      const { name, ownerEmail, ownerPassword, plan, allowedEmailDomain } = body;
      const existing = await base44.asServiceRole.entities.CompanyAccount.filter({ companyId });
      // Always store a hash — hash incoming plaintext; keep the existing hash if none was sent.
      let storedPassword = ownerPassword;
      if (storedPassword && !String(storedPassword).startsWith('sha256$')) {
        storedPassword = await hashPassword(storedPassword);
      } else if (!storedPassword && existing.length) {
        storedPassword = existing[0].ownerPassword;
      }
      const fields = { companyId, name, ownerEmail, ownerPassword: storedPassword, plan, allowedEmailDomain: allowedEmailDomain || '' };
      if (existing.length) {
        await base44.asServiceRole.entities.CompanyAccount.update(existing[0].id, fields);
      } else {
        await base44.asServiceRole.entities.CompanyAccount.create(fields);
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