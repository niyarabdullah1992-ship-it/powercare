import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Company-scoped Employee/Station access. Runs with the service role only —
// the Employee/Station entities themselves are locked down (no public RLS),
// so this function is the sole gateway and always filters by companyId,
// preventing one company from ever reading or writing another's records.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, companyId } = body;
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