import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";

// Fallback high-accuracy locator for desktop check-ins.
// Calls Google Geolocation API (same service government sites use) — only invoked
// by the frontend when the browser's own location fix is missing or too coarse,
// to keep API usage (and cost) minimal.
// Not public: a valid company session (or the platform builder) is required, so
// anonymous callers cannot drain the paid geolocation API quota.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== "admin") {
      const { sessionToken, companyId } = body;
      let authed = false;
      if (sessionToken && companyId) {
        const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: sessionToken, companyId });
        const s = sessions[0];
        authed = !!(s && new Date(s.expiresAt).getTime() > Date.now());
      }
      if (!authed) return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const key = Deno.env.get("GOOGLE_GEOLOCATION_API_KEY");
    if (!key) {
      console.error("GOOGLE_GEOLOCATION_API_KEY is not set");
      return Response.json({ error: "NOT_CONFIGURED" }, { status: 500 });
    }

    const res = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ considerIp: true }),
      }
    );

    const data = await res.json();
    if (!res.ok || !data?.location) {
      console.error("Google Geolocation error:", JSON.stringify(data));
      return Response.json({ error: data?.error?.message || "GEOLOCATE_FAILED" }, { status: 502 });
    }

    return Response.json({
      lat: data.location.lat,
      lng: data.location.lng,
      accuracy: data.accuracy ?? null,
      source: "google",
    });
  } catch (error) {
    console.error("googleGeolocate failed:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});