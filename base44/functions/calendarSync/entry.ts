import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Adds an event to the connected Google Calendar (tasks deadlines / planner items).
// Auth: PowerCare session token (custom auth) or platform admin.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { sessionToken, companyId, title, description, date, time, endDate } = body;

    const platformUser = await base44.auth.me().catch(() => null);
    let authorized = !!(platformUser && platformUser.role === "admin");
    if (!authorized && sessionToken && companyId) {
      const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: sessionToken, companyId });
      const s = sessions[0];
      authorized = !!(s && new Date(s.expiresAt).getTime() > Date.now());
    }
    if (!authorized) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
      return Response.json({ error: "Missing title or date (YYYY-MM-DD)" }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");

    const nextDay = (d) => {
      const dt = new Date(`${d}T00:00:00Z`);
      dt.setUTCDate(dt.getUTCDate() + 1);
      return dt.toISOString().slice(0, 10);
    };

    let start, end;
    if (time && /^\d{2}:\d{2}$/.test(time)) {
      // Timed event, 1 hour long
      const [h, m] = time.split(":").map(Number);
      const endMinutes = h * 60 + m + 60;
      const endTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
      const endDateStr = endMinutes >= 1440 ? nextDay(date) : date;
      start = { dateTime: `${date}T${time}:00`, timeZone: "Asia/Riyadh" };
      end = { dateTime: `${endDateStr}T${endTime}:00`, timeZone: "Asia/Riyadh" };
    } else {
      // All-day event (end date is exclusive in Google Calendar)
      start = { date };
      end = { date: nextDay(/^\d{4}-\d{2}-\d{2}$/.test(endDate || "") ? endDate : date) };
    }

    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: title,
        description: description || "",
        start,
        end,
        reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }, { method: "email", minutes: 60 }] },
      }),
    });
    const created = await res.json();
    if (!res.ok) {
      console.error("Calendar event failed:", JSON.stringify(created));
      return Response.json({ error: created?.error?.message || "Failed to create calendar event" }, { status: 400 });
    }
    return Response.json({ ok: true, eventId: created.id, link: created.htmlLink });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});