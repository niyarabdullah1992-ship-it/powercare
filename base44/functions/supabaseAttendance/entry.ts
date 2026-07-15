import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";

const MANAGER_ROLES = ["director", "ops_manager", "pgm", "station_manager"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "").replace(/\/rest\/v\d+$/, "");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { action } = body;
    const headers = {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    };
    // ---- Server-side authorization ----
    // Roles are never trusted from the request body. The caller must present the
    // session token issued at login; the role is derived from the server's own
    // Employee record. Scheduled-workflow sweeps run without a user session.
    const SWEEP_ACTIONS = ["checkLateAlerts", "markAbsentees"];
    let auth = null;
    if (!SWEEP_ACTIONS.includes(action)) {
      const platformUser = await base44.auth.me().catch(() => null);
      if (platformUser && platformUser.role === "admin") {
        auth = { admin: true, isManager: true, role: "owner", companyId: body.companyId || null, userId: body.userId || null };
      } else {
        const { sessionToken, companyId } = body;
        if (sessionToken && companyId) {
          const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: sessionToken, companyId });
          const s = sessions[0];
          if (s && new Date(s.expiresAt).getTime() > Date.now()) {
            if (s.role === "owner") {
              auth = { isManager: true, role: "owner", companyId, userId: s.userId || null };
            } else {
              const emps = await base44.asServiceRole.entities.Employee.filter({ companyId, employeeId: s.userId });
              const emp = emps[0] || null;
              auth = { isManager: MANAGER_ROLES.includes(emp?.role), role: emp?.role || "employee", companyId, userId: s.userId };
            }
          }
        }
      }
      if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isManager = !!auth?.isManager;
    // ---- Multi-tenant boundary ----
    // A requested employeeId must belong to the caller's validated company.
    const employeeInCompany = async (employeeId) => {
      if (auth?.admin) return true;
      if (!auth?.companyId || !employeeId) return false;
      const emps = await base44.asServiceRole.entities.Employee.filter({ companyId: auth.companyId, employeeId });
      return emps.length > 0;
    };
    const filterCompanyEmployeeIds = async (ids) => {
      if (auth?.admin) return ids;
      if (!auth?.companyId) return [];
      const emps = await base44.asServiceRole.entities.Employee.filter({ companyId: auth.companyId });
      const allowed = new Set(emps.map((e) => e.employeeId));
      return (ids || []).filter((id) => allowed.has(id));
    };
    const todayStr = () => new Date().toISOString().slice(0, 10);
    // Strict date formats — values are interpolated into PostgREST query strings,
    // so anything not matching is rejected (blocks query-parameter injection).
    const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
    const isMonth = (v) => /^\d{4}-\d{2}$/.test(String(v || ""));
    const toMinutes = (hhmm) => {
      const parts = (hhmm || "").split(":").map(Number);
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    };
    // Haversine distance in meters between two GPS points — used for check-in location verification.
    const distanceMeters = (lat1, lng1, lat2, lng2) => {
      const R = 6371000;
      const toRad = (d) => (d * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    // Server-side workplace coordinates — station GPS/radius is NEVER trusted from
    // the client. It is loaded from the company's own Station record (or a saved
    // personal place) using the stationId, so an employee cannot submit their home
    // coordinates as the "station" to fake being inside the check-in radius.
    const resolveWorkplace = async (stationId) => {
      const companyId = auth?.companyId || body.companyId;
      if (!companyId || !stationId) return null;
      const stations = await base44.asServiceRole.entities.Station.filter({ companyId, stationId });
      const st = stations[0];
      if (st && st.lat != null && st.lng != null) {
        return { lat: Number(st.lat), lng: Number(st.lng), radiusMeters: Number(st.radiusMeters) || 200 };
      }
      const blobs = await base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId, category: "personalPlaces" });
      const place = (blobs[0]?.payload || []).find((p) => p.id === stationId);
      if (place && place.lat != null && place.lng != null) {
        return { lat: Number(place.lat), lng: Number(place.lng), radiusMeters: Number(place.radiusMeters) || 200 };
      }
      return null;
    };

    if (action === "getSettings") {
      const { companyId } = body;
      const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance_settings?company_id=eq.${encodeURIComponent(companyId)}`, { headers });
      const rows = await res.json();
      const defaults = { company_id: companyId, work_start_time: "08:00", late_threshold_minutes: 15, gps_enabled: true, gps_required: true };
      if (!res.ok || !Array.isArray(rows) || rows.length === 0) return Response.json({ settings: defaults });
      return Response.json({ settings: rows[0] });
    }

    if (action === "updateSettings") {
      if (!isManager) return Response.json({ error: "Forbidden" }, { status: 403 });
      const { companyId, workStartTime, lateThresholdMinutes, gpsEnabled, gpsRequired } = body;
      if (!companyId) return Response.json({ error: "Missing companyId" }, { status: 400 });
      const patch = {
        company_id: companyId,
        work_start_time: workStartTime || "08:00",
        late_threshold_minutes: Number(lateThresholdMinutes) || 15,
        gps_enabled: !!gpsEnabled,
        gps_required: !!gpsRequired,
      };
      const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance_settings`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      if (!res.ok) {
        return Response.json({ error: updated?.message || "Failed to save settings — run: CREATE TABLE IF NOT EXISTS attendance_settings (company_id text primary key, work_start_time text default '08:00', late_threshold_minutes integer default 15, gps_enabled boolean default false, gps_required boolean default false);" }, { status: 400 });
      }
      return Response.json({ settings: Array.isArray(updated) ? updated[0] : updated });
    }

    // One-shot maintenance: turns GPS on for every company that already has a settings row.
    if (action === "enableGpsEverywhere") {
      if (!isManager) return Response.json({ error: "Forbidden" }, { status: 403 });
      const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance_settings?or=(gps_enabled.eq.false,gps_required.eq.false)`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ gps_enabled: true, gps_required: true }),
      });
      const updated = await res.json();
      if (!res.ok) return Response.json({ error: updated?.message || "Failed" }, { status: 400 });
      return Response.json({ ok: true, updated: Array.isArray(updated) ? updated.length : 0 });
    }

    if (action === "syncRoster") {
      const { companyId, employees } = body;
      if (!companyId || !Array.isArray(employees)) return Response.json({ error: "Missing fields" }, { status: 400 });
      const rows = employees.map((e) => ({ employee_id: e.id, company_id: companyId, name: e.name, station_id: e.stationId || null, manager_id: e.managerId || null }));
      if (rows.length === 0) return Response.json({ ok: true });
      const res = await fetch(`${SUPABASE_URL}/rest/v1/employees_directory`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(rows),
      });
      if (!res.ok) {
        const err = await res.json();
        return Response.json({ error: err?.message || "Failed to sync roster — run: CREATE TABLE IF NOT EXISTS employees_directory (employee_id text primary key, company_id text, name text, station_id text, updated_at timestamptz default now()); -- if it already exists: ALTER TABLE employees_directory ADD COLUMN IF NOT EXISTS manager_id text, ADD COLUMN IF NOT EXISTS late_alert_sent_date text;" }, { status: 400 });
      }
      return Response.json({ ok: true });
    }

    // ---- Instant late-check-in alert: only employees assigned to a shift today ----
    // are eligible, preventing owners, off-duty staff, and unscheduled employees from
    // receiving false absence alerts.
    if (action === "checkLateAlerts") {
      const now = new Date();
      const dateParts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23",
      }).formatToParts(now).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
      const date = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
      const nowMinutes = Number(dateParts.hour) * 60 + Number(dateParts.minute);
      const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Riyadh", weekday: "short" }).format(now);
      const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
      const dirRes = await fetch(`${SUPABASE_URL}/rest/v1/employees_directory?select=*`, { headers });
      const directory = await dirRes.json();
      if (!dirRes.ok || !Array.isArray(directory) || directory.length === 0) return Response.json({ ok: true, alerted: 0 });

      const attRes = await fetch(`${SUPABASE_URL}/rest/v1/attendance?date=eq.${date}&select=employee_id`, { headers });
      const attRows = await attRes.json();
      const checkedIn = new Set((Array.isArray(attRows) ? attRows : []).map((row) => row.employee_id));
      const settingsCache = {};
      const schedulesCache = {};
      const getSettings = async (companyId) => {
        if (settingsCache[companyId]) return settingsCache[companyId];
        const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance_settings?company_id=eq.${encodeURIComponent(companyId)}`, { headers });
        const rows = await res.json();
        settingsCache[companyId] = (Array.isArray(rows) && rows[0]) || { late_threshold_minutes: 15 };
        return settingsCache[companyId];
      };
      const getSchedules = async (companyId) => {
        if (schedulesCache[companyId]) return schedulesCache[companyId];
        const blobs = await base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId, category: "schedules" });
        schedulesCache[companyId] = blobs[0]?.payload || [];
        return schedulesCache[companyId];
      };

      let alerted = 0;
      for (const emp of directory) {
        if (checkedIn.has(emp.employee_id) || emp.late_alert_sent_date === date || !emp.manager_id) continue;
        const schedules = await getSchedules(emp.company_id);
        const stationSchedule = schedules.find((schedule) => schedule.stationId === emp.station_id);
        const shift = (stationSchedule?.shiftTypes || []).find((item) =>
          (stationSchedule.assignments?.[dayIndex]?.[item.id] || []).includes(emp.employee_id)
        );
        if (!shift) continue;
        const settings = await getSettings(emp.company_id);
        const lateMinutes = nowMinutes - toMinutes(shift.start);
        if (lateMinutes <= (settings.late_threshold_minutes || 15)) continue;
        await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            user_id: emp.manager_id,
            message: `⏰ ${emp.name || "Employee"} has not checked in — ${lateMinutes} minutes past the allowed time.`,
          }),
        });
        await fetch(`${SUPABASE_URL}/rest/v1/employees_directory?employee_id=eq.${encodeURIComponent(emp.employee_id)}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ late_alert_sent_date: date }),
        });
        alerted++;
      }
      return Response.json({ ok: true, alerted });
    }

    // ---- Check in / out ----
    // Shift start/end times come from the station's existing weekly schedule (Schedules
    // page) — the frontend resolves the employee's shift for today and passes it in.

    if (action === "checkIn") {
      const { companyId, employeeId, employeeName, stationId, lat, lng, accuracy, shiftStart } = body;
      if (!companyId || !employeeId) return Response.json({ error: "Missing fields" }, { status: 400 });
      // Employees may only check in as themselves — identity comes from the session.
      if (!isManager && auth?.userId && employeeId !== auth.userId) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      const date = todayStr();
      const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/attendance?employee_id=eq.${encodeURIComponent(employeeId)}&date=eq.${date}`, { headers });
      const existing = await existingRes.json();
      if (Array.isArray(existing) && existing.length > 0 && existing[0].check_in_at) {
        return Response.json({ error: "ALREADY_CHECKED_IN", attendance: existing[0] }, { status: 400 });
      }
      const setRes = await fetch(`${SUPABASE_URL}/rest/v1/attendance_settings?company_id=eq.${encodeURIComponent(companyId)}`, { headers });
      const setRows = await setRes.json();
      const settings = (Array.isArray(setRows) && setRows[0]) || { work_start_time: "08:00", late_threshold_minutes: 15, gps_enabled: true, gps_required: true };
      if (lat == null || lng == null) {
        return Response.json({ error: "GPS_REQUIRED" }, { status: 400 });
      }
      const workplace = await resolveWorkplace(stationId);
      if (!workplace) {
        return Response.json({ error: "STATION_LOCATION_REQUIRED" }, { status: 400 });
      }
      const now = new Date();
      const startMinutes = toMinutes(shiftStart || settings.work_start_time || "08:00");
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const lateMinutes = Math.max(0, nowMinutes - startMinutes);
      const status = lateMinutes > (settings.late_threshold_minutes || 0) ? "late" : "present";
      const distMeters = Math.round(distanceMeters(lat, lng, workplace.lat, workplace.lng));
      // GPS readings carry an accuracy radius — give the employee the benefit of
      // that margin (capped at 100m) so an imprecise fix isn't wrongly "outside".
      const accuracyMargin = Math.min(Number(accuracy) || 0, 100);
      const locationStatus = distMeters - accuracyMargin <= workplace.radiusMeters ? "inside" : "outside";
      if (locationStatus !== "inside") {
        return Response.json({ error: "OUTSIDE_STATION", distanceMeters: distMeters }, { status: 400 });
      }
      const payload = {
        company_id: companyId,
        employee_id: employeeId,
        employee_name: employeeName || "",
        station_id: stationId || null,
        date,
        check_in_at: now.toISOString(),
        status,
        late_minutes: status === "late" ? lateMinutes : 0,
        excused: false,
        early_checkout: false,
        check_in_lat: lat ?? null,
        check_in_lng: lng ?? null,
        station_lat: workplace.lat,
        station_lng: workplace.lng,
        distance_meters: distMeters,
        location_status: locationStatus,
      };
      let res;
      if (Array.isArray(existing) && existing.length > 0) {
        res = await fetch(`${SUPABASE_URL}/rest/v1/attendance?id=eq.${encodeURIComponent(existing[0].id)}`, {
          method: "PATCH",
          headers: { ...headers, Prefer: "return=representation" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${SUPABASE_URL}/rest/v1/attendance`, {
          method: "POST",
          headers: { ...headers, Prefer: "return=representation" },
          body: JSON.stringify(payload),
        });
      }
      const saved = await res.json();
      if (!res.ok) {
        return Response.json({ error: saved?.message || "Failed to check in — run: CREATE TABLE IF NOT EXISTS attendance (id uuid primary key default gen_random_uuid(), company_id text, employee_id text, employee_name text, station_id text, date text, check_in_at timestamptz, check_out_at timestamptz, status text, late_minutes numeric default 0, excused boolean default false, excused_by text, excused_by_name text, excused_note text, excused_at timestamptz, early_checkout boolean default false, work_hours numeric, check_in_lat numeric, check_in_lng numeric, station_lat numeric, station_lng numeric, distance_meters numeric, location_status text, created_at timestamptz default now()); -- if the table already exists, instead run: ALTER TABLE attendance ADD COLUMN IF NOT EXISTS station_lat numeric, ADD COLUMN IF NOT EXISTS station_lng numeric, ADD COLUMN IF NOT EXISTS distance_meters numeric, ADD COLUMN IF NOT EXISTS location_status text;" }, { status: 400 });
      }
      await fetch(`${SUPABASE_URL}/rest/v1/employees_directory`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify([{ employee_id: employeeId, company_id: companyId, name: employeeName || "", station_id: stationId || null }]),
      });
      return Response.json({ attendance: Array.isArray(saved) ? saved[0] : saved });
    }

    if (action === "checkOut") {
      const { employeeId, shiftEnd, lat, lng, accuracy } = body;
      if (!employeeId) return Response.json({ error: "Missing employeeId" }, { status: 400 });
      // Employees may only check out as themselves — identity comes from the session.
      if (!isManager && auth?.userId && employeeId !== auth.userId) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      if (lat == null || lng == null) return Response.json({ error: "GPS_REQUIRED" }, { status: 400 });
      const date = todayStr();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance?employee_id=eq.${encodeURIComponent(employeeId)}&date=eq.${date}`, { headers });
      const rows = await res.json();
      const row = Array.isArray(rows) && rows[0];
      if (!row || !row.check_in_at) return Response.json({ error: "NOT_CHECKED_IN" }, { status: 400 });
      // Verify the checkout location against the server-stored station coordinates
      // from this morning's check-in record — never client-supplied coordinates.
      const workplace = await resolveWorkplace(row.station_id || body.stationId);
      if (!workplace) return Response.json({ error: "STATION_LOCATION_REQUIRED" }, { status: 400 });
      const checkoutDistance = Math.round(distanceMeters(lat, lng, workplace.lat, workplace.lng));
      const accuracyMargin = Math.min(Number(accuracy) || 0, 100);
      if (checkoutDistance - accuracyMargin > workplace.radiusMeters) {
        return Response.json({ error: "OUTSIDE_STATION", distanceMeters: checkoutDistance }, { status: 400 });
      }
      const now = new Date();
      const workHours = Math.round(((now.getTime() - new Date(row.check_in_at).getTime()) / 3600000) * 100) / 100;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const earlyCheckout = !!shiftEnd && nowMinutes < toMinutes(shiftEnd);
      const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/attendance?id=eq.${encodeURIComponent(row.id)}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ check_out_at: now.toISOString(), work_hours: workHours, early_checkout: earlyCheckout, check_out_lat: lat, check_out_lng: lng }),
      });
      const updated = await patchRes.json();
      if (!patchRes.ok) {
        console.error("checkOut failed:", updated?.message || updated);
        return Response.json({ error: updated?.message || "Failed to save checkout location" }, { status: 400 });
      }
      return Response.json({ attendance: updated[0], checkoutDistance });
    }

    // ---- Manager: excuse a late/absent record (keeps the record, removes the penalty) ----

    if (action === "excuseAttendance") {
      if (!isManager) return Response.json({ error: "Forbidden" }, { status: 403 });
      const { attendanceId, managerId, managerName, excused, note } = body;
      if (!attendanceId) return Response.json({ error: "Missing attendanceId" }, { status: 400 });
      const patch = excused
        ? { excused: true, excused_by: managerId || null, excused_by_name: managerName || "", excused_note: note || "", excused_at: new Date().toISOString() }
        : { excused: false, excused_by: null, excused_by_name: "", excused_note: "", excused_at: null };
      const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance?id=eq.${encodeURIComponent(attendanceId)}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      if (!res.ok) return Response.json({ error: updated?.message || "Failed to update excuse" }, { status: 400 });
      return Response.json({ attendance: Array.isArray(updated) ? updated[0] : updated });
    }

    if (action === "getTodayStatus") {
      const { employeeId } = body;
      if (!employeeId) return Response.json({ error: "Missing employeeId" }, { status: 400 });
      if (!(await employeeInCompany(employeeId))) return Response.json({ error: "Forbidden" }, { status: 403 });
      const date = todayStr();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance?employee_id=eq.${encodeURIComponent(employeeId)}&date=eq.${date}`, { headers });
      const rows = await res.json();
      if (!res.ok) return Response.json({ attendance: null });
      return Response.json({ attendance: (Array.isArray(rows) && rows[0]) || null });
    }

    if (action === "listDaily") {
      const { employeeIds, date } = body;
      if (!Array.isArray(employeeIds) || employeeIds.length === 0) return Response.json({ rows: [] });
      const scopedIds = await filterCompanyEmployeeIds(employeeIds);
      if (scopedIds.length === 0) return Response.json({ rows: [] });
      if (date && !isDate(date)) return Response.json({ error: "Invalid date" }, { status: 400 });
      const d = date || todayStr();
      const idsList = scopedIds.map((id) => `"${id}"`).join(",");
      const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance?employee_id=in.(${idsList})&date=eq.${d}`, { headers });
      const rows = await res.json();
      if (!res.ok) return Response.json({ rows: [] });
      return Response.json({ rows: rows || [] });
    }

    if (action === "listMonthly") {
      const { employeeId, month } = body;
      if (!employeeId || !month) return Response.json({ error: "Missing fields" }, { status: 400 });
      if (!isMonth(month)) return Response.json({ error: "Invalid month" }, { status: 400 });
      if (!(await employeeInCompany(employeeId))) return Response.json({ error: "Forbidden" }, { status: 403 });
      const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance?employee_id=eq.${encodeURIComponent(employeeId)}&date=gte.${month}-01&date=lte.${month}-31&order=date.asc`, { headers });
      const rows = await res.json();
      if (!res.ok) return Response.json({ rows: [] });
      return Response.json({ rows: rows || [] });
    }

    // ---- Flexible date-range report (used by the monthly/3mo/6mo/yearly/custom report filters) ----

    if (action === "listRange") {
      const { employeeId, startDate, endDate } = body;
      if (!employeeId || !startDate || !endDate) return Response.json({ error: "Missing fields" }, { status: 400 });
      if (!isDate(startDate) || !isDate(endDate)) return Response.json({ error: "Invalid date range" }, { status: 400 });
      if (!(await employeeInCompany(employeeId))) return Response.json({ error: "Forbidden" }, { status: 403 });
      const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance?employee_id=eq.${encodeURIComponent(employeeId)}&date=gte.${startDate}&date=lte.${endDate}&order=date.asc`, { headers });
      const rows = await res.json();
      if (!res.ok) return Response.json({ rows: [] });
      return Response.json({ rows: rows || [] });
    }

    // ---- Manager analytics: attendance rate, late frequency, employee comparison ----

    if (action === "getAnalytics") {
      if (!isManager) return Response.json({ error: "Forbidden" }, { status: 403 });
      const { employeeIds: rawIds, month } = body;
      if (!Array.isArray(rawIds) || rawIds.length === 0 || !month) return Response.json({ stats: [] });
      if (!isMonth(month)) return Response.json({ error: "Invalid month" }, { status: 400 });
      const employeeIds = await filterCompanyEmployeeIds(rawIds);
      if (employeeIds.length === 0) return Response.json({ stats: [] });
      const idsList = employeeIds.map((id) => `"${id}"`).join(",");
      const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance?employee_id=in.(${idsList})&date=gte.${month}-01&date=lte.${month}-31`, { headers });
      const rows = await res.json();
      if (!res.ok || !Array.isArray(rows)) return Response.json({ stats: [] });
      const byEmployee = {};
      for (const id of employeeIds) byEmployee[id] = { employeeId: id, present: 0, late: 0, excusedLate: 0, absent: 0, offDay: 0, lateMinutesSum: 0 };
      for (const r of rows) {
        const bucket = byEmployee[r.employee_id];
        if (!bucket) continue;
        if (r.status === "present") bucket.present++;
        else if (r.status === "late") {
          if (r.excused) bucket.excusedLate++;
          else bucket.late++;
          bucket.lateMinutesSum += Number(r.late_minutes) || 0;
        } else if (r.status === "absent") {
          if (!r.excused) bucket.absent++;
        } else if (r.status === "off_day") bucket.offDay++;
      }
      const stats = Object.values(byEmployee).map((b) => {
        const worked = b.present + b.late + b.excusedLate;
        const counted = worked + b.absent;
        const lateEvents = b.late + b.excusedLate;
        return {
          ...b,
          attendanceRate: counted > 0 ? Math.round((worked / counted) * 1000) / 10 : null,
          avgLateMinutes: lateEvents > 0 ? Math.round((b.lateMinutesSum / lateEvents) * 10) / 10 : 0,
        };
      });
      return Response.json({ stats });
    }

    if (action === "markAbsentees") {
      // Called by the daily scheduled workflow — marks anyone in the roster with
      // no attendance row yet today as absent.
      const date = todayStr();
      const dirRes = await fetch(`${SUPABASE_URL}/rest/v1/employees_directory?select=*`, { headers });
      const directory = await dirRes.json();
      if (!dirRes.ok || !Array.isArray(directory) || directory.length === 0) return Response.json({ ok: true, marked: 0 });
      const attRes = await fetch(`${SUPABASE_URL}/rest/v1/attendance?date=eq.${date}&select=employee_id`, { headers });
      const attRows = await attRes.json();
      const already = new Set((Array.isArray(attRows) ? attRows : []).map((r) => r.employee_id));
      const missing = directory.filter((e) => !already.has(e.employee_id));
      if (missing.length === 0) return Response.json({ ok: true, marked: 0 });
      const inserts = missing.map((e) => ({
        company_id: e.company_id,
        employee_id: e.employee_id,
        employee_name: e.name,
        station_id: e.station_id,
        date,
        status: "absent",
        late_minutes: 0,
        excused: false,
        early_checkout: false,
        work_hours: 0,
      }));
      const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(inserts),
      });
      if (!res.ok) {
        const err = await res.json();
        return Response.json({ error: err?.message || "Failed to mark absentees" }, { status: 400 });
      }
      return Response.json({ ok: true, marked: missing.length });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});