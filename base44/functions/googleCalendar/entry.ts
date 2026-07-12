import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Workspace connector "PowerCare Calendar v2" — each app user connects their own Google account.
const CONNECTOR_ID = "6a537ecedf0deaf86823d8ce";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

    if (body.action === "createEvent") {
      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers,
        body: JSON.stringify({
          summary: body.title,
          description: body.description || "",
          start: { dateTime: body.start },
          end: { dateTime: body.end },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("googleCalendar createEvent failed:", JSON.stringify(data));
        return Response.json({ error: data.error?.message || "create_failed" }, { status: 500 });
      }
      return Response.json({ event: data });
    }

    // default action: list upcoming events
    const params = new URLSearchParams({
      timeMin: new Date().toISOString(),
      maxResults: "15",
      singleEvents: "true",
      orderBy: "startTime",
    });
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, { headers });
    const data = await res.json();
    if (!res.ok) {
      console.error("googleCalendar listEvents failed:", JSON.stringify(data));
      return Response.json({ error: data.error?.message || "list_failed" }, { status: 500 });
    }
    return Response.json({ events: data.items || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});