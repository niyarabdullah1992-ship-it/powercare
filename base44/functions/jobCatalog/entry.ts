// Job titles & seats catalog gateway. Titles/seats live in company data blobs
// (categories jobTitles / jobSeats) and are written only through this function.
// Seat assignment is validated server-side: no vacant seat → no appointment.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { authPowerCareSession } from '../../shared/powerCareSession.ts';

async function readCat(svc, companyId, category) {
  const rows = await svc.CompanyDataBlob.filter({ companyId, category });
  return { row: rows[0] || null, items: Array.isArray(rows[0]?.payload) ? rows[0].payload : [] };
}
async function writeCat(svc, companyId, category, row, items) {
  if (row) await svc.CompanyDataBlob.update(row.id, { payload: items });
  else await svc.CompanyDataBlob.create({ companyId, category, payload: items });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, companyId } = body;
    if (!companyId) return Response.json({ error: 'Missing companyId' }, { status: 400 });
    const svc = base44.asServiceRole.entities;

    const auth = await authPowerCareSession(base44, companyId, body.sessionToken);
    if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const canRead = auth.admin || auth.owner || auth.role === 'owner' || ['director', 'ops_manager', 'pgm', 'station_manager'].includes(auth.role) || !!auth.hrLevelId;
    if (!canRead) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const canWrite = auth.admin || auth.owner || auth.role === 'owner' || auth.role === 'director' || !!auth.hrLevelId;

    const audit = async (auditAction, details) => {
      try {
        await svc.AuditLog.create({ companyId, action: auditAction, performedBy: String(auth.name || 'HR').slice(0, 100), details: String(details || '').slice(0, 1000) });
      } catch (e) { console.error('catalog audit failed:', e.message); }
    };

    if (action === 'get') {
      const [titles, seats] = await Promise.all([readCat(svc, companyId, 'jobTitles'), readCat(svc, companyId, 'jobSeats')]);
      return Response.json({ titles: titles.items, seats: seats.items });
    }

    if (!canWrite) return Response.json({ error: 'Forbidden: HR access required' }, { status: 403 });

    if (action === 'saveTitle') {
      const input = body.title || {};
      if (!String(input.name || '').trim()) return Response.json({ error: 'name_required' }, { status: 400 });
      const { row, items } = await readCat(svc, companyId, 'jobTitles');
      const record = {
        id: input.id || 'jt_' + crypto.randomUUID().replace(/-/g, '').slice(0, 8),
        name: String(input.name).trim().slice(0, 120),
        ladder: ['general', 'technical', 'health', 'contract'].includes(input.ladder) ? input.ladder : 'general',
        grade: String(input.grade || '').slice(0, 60),
        duties: String(input.duties || '').slice(0, 2000),
        effortWeight: Number(input.effortWeight) || 1,
      };
      const index = items.findIndex((item) => item.id === record.id);
      if (index >= 0) items[index] = { ...items[index], ...record }; else items.push(record);
      await writeCat(svc, companyId, 'jobTitles', row, items);
      await audit('job_title_saved', `حفظ المسمى الوظيفي "${record.name}" (${record.ladder} / ${record.grade}).`);
      return Response.json({ ok: true, title: record });
    }

    if (action === 'deleteTitle') {
      const titleId = String(body.titleId || '');
      const [titles, seats] = await Promise.all([readCat(svc, companyId, 'jobTitles'), readCat(svc, companyId, 'jobSeats')]);
      if (seats.items.some((seat) => seat.titleId === titleId)) return Response.json({ error: 'title_in_use' }, { status: 409 });
      const removed = titles.items.find((item) => item.id === titleId);
      await writeCat(svc, companyId, 'jobTitles', titles.row, titles.items.filter((item) => item.id !== titleId));
      await audit('job_title_deleted', `حذف المسمى الوظيفي "${removed?.name || titleId}".`);
      return Response.json({ ok: true });
    }

    if (action === 'saveSeat') {
      const input = body.seat || {};
      if (!input.titleId || !input.unitId) return Response.json({ error: 'title_and_unit_required' }, { status: 400 });
      const { row, items } = await readCat(svc, companyId, 'jobSeats');
      const existing = items.find((item) => item.id === input.id);
      const record = {
        id: input.id || 'seat_' + crypto.randomUUID().replace(/-/g, '').slice(0, 8),
        titleId: String(input.titleId),
        unitId: String(input.unitId),
        managerId: input.managerId || null,
        approvedCount: Math.max(1, Number(input.approvedCount) || 1),
        assignedEmployeeIds: existing?.assignedEmployeeIds || [],
      };
      if (record.approvedCount < record.assignedEmployeeIds.length) return Response.json({ error: 'approved_below_occupied' }, { status: 409 });
      const index = items.findIndex((item) => item.id === record.id);
      if (index >= 0) items[index] = record; else items.push(record);
      await writeCat(svc, companyId, 'jobSeats', row, items);
      await audit('job_seat_saved', `حفظ مقعد وظيفي (${record.id}) — معتمد ${record.approvedCount}.`);
      return Response.json({ ok: true, seat: record });
    }

    if (action === 'deleteSeat') {
      const seatId = String(body.seatId || '');
      const { row, items } = await readCat(svc, companyId, 'jobSeats');
      const seat = items.find((item) => item.id === seatId);
      if (!seat) return Response.json({ error: 'not_found' }, { status: 404 });
      if ((seat.assignedEmployeeIds || []).length) return Response.json({ error: 'seat_occupied' }, { status: 409 });
      await writeCat(svc, companyId, 'jobSeats', row, items.filter((item) => item.id !== seatId));
      await audit('job_seat_deleted', `حذف المقعد الوظيفي ${seatId}.`);
      return Response.json({ ok: true });
    }

    if (action === 'assignSeat') {
      const { seatId, employeeId } = body;
      if (!seatId || !employeeId) return Response.json({ error: 'missing_fields' }, { status: 400 });
      const { row, items } = await readCat(svc, companyId, 'jobSeats');
      const seat = items.find((item) => item.id === seatId);
      if (!seat) return Response.json({ error: 'not_found' }, { status: 404 });
      const assigned = seat.assignedEmployeeIds || [];
      if (assigned.includes(employeeId)) return Response.json({ ok: true, seat });
      if (assigned.length >= (Number(seat.approvedCount) || 0)) return Response.json({ error: 'no_vacant_seat' }, { status: 409 });
      // one employee occupies exactly one seat
      for (const other of items) {
        other.assignedEmployeeIds = (other.assignedEmployeeIds || []).filter((id) => id !== employeeId);
      }
      seat.assignedEmployeeIds = [...(seat.assignedEmployeeIds || []), employeeId];
      await writeCat(svc, companyId, 'jobSeats', row, items);
      await audit('job_seat_assigned', `تعيين الموظف ${employeeId} على المقعد ${seatId}.`);
      return Response.json({ ok: true, seat });
    }

    if (action === 'unassignSeat') {
      const { seatId, employeeId } = body;
      const { row, items } = await readCat(svc, companyId, 'jobSeats');
      const seat = items.find((item) => item.id === seatId);
      if (!seat) return Response.json({ error: 'not_found' }, { status: 404 });
      seat.assignedEmployeeIds = (seat.assignedEmployeeIds || []).filter((id) => id !== employeeId);
      await writeCat(svc, companyId, 'jobSeats', row, items);
      await audit('job_seat_unassigned', `إخلاء المقعد ${seatId} من الموظف ${employeeId}.`);
      return Response.json({ ok: true, seat });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('jobCatalog error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});