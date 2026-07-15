import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// ERP integration API: external systems read company data with an API key,
// and PowerCare pushes HMAC-signed webhook events to the configured ERP endpoint.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    /* ---- External ERP read API (apiKey auth) ---- */
    if (action === "api") {
      const { apiKey, resource } = body;
      if (!apiKey) return Response.json({ error: "apiKey required" }, { status: 401 });
      const settings = (await svc.entities.ErpSettings.filter({ apiKey }))[0];
      if (!settings) return Response.json({ error: "invalid apiKey" }, { status: 401 });
      const companyId = settings.companyId;
      if (resource === "employees") {
        const employees = await svc.entities.Employee.filter({ companyId }, "-created_date", 500);
        return Response.json({ employees });
      }
      if (resource === "stations") {
        const stations = await svc.entities.Station.filter({ companyId }, "-created_date", 500);
        return Response.json({ stations });
      }
      const BLOBS = ["tasks", "reports", "safety", "payrollRuns", "schedules", "plans"];
      if (BLOBS.includes(resource)) {
        const blob = (await svc.entities.CompanyDataBlob.filter({ companyId, category: resource }))[0];
        return Response.json({ [resource]: blob?.payload || [] });
      }
      return Response.json({ error: "unknown resource", available: ["employees", "stations", ...BLOBS] }, { status: 400 });
    }

    /* ---- Company-scoped management (PowerCare session token auth) ---- */
    const { companyId, sessionToken } = body;
    if (!companyId || !sessionToken) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const session = (await svc.entities.CompanySession.filter({ companyId, token: sessionToken }))[0];
    if (!session || new Date(session.expiresAt) < new Date()) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const getSettings = async () => (await svc.entities.ErpSettings.filter({ companyId }))[0] || null;
    const upsert = async (updates) => {
      const s = await getSettings();
      if (s) await svc.entities.ErpSettings.update(s.id, updates);
      else await svc.entities.ErpSettings.create({ companyId, ...updates });
    };

    if (action === "getSettings") {
      const s = await getSettings();
      return Response.json({
        apiKey: s?.apiKey || null,
        webhookUrl: s?.webhookUrl || "",
        webhookEvents: s?.webhookEvents || [],
        endpointUrl: `https://base44.app/api/apps/${Deno.env.get("BASE44_APP_ID")}/functions/erpApi`,
      });
    }

    if (action === "generateApiKey") {
      const bytes = crypto.getRandomValues(new Uint8Array(24));
      const key = "pwc_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      await upsert({ apiKey: key });
      return Response.json({ apiKey: key });
    }

    if (action === "setWebhook") {
      await upsert({ webhookUrl: body.webhookUrl || "", webhookEvents: body.webhookEvents || [] });
      return Response.json({ ok: true });
    }

    if (action === "dispatchWebhook" || action === "testWebhook") {
      const s = await getSettings();
      if (!s?.webhookUrl) return Response.json({ ok: false, error: "no_webhook" });
      const event = action === "testWebhook" ? "test" : body.event;
      if (action === "dispatchWebhook" && (s.webhookEvents || []).length > 0 && !s.webhookEvents.includes(event)) {
        return Response.json({ ok: true, skipped: true });
      }
      const payload = JSON.stringify({ source: "powercare", companyId, event, data: body.data || {}, sentAt: new Date().toISOString() });
      let signature = "";
      if (s.apiKey) {
        const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(s.apiKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
        signature = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
      let status = 0;
      try {
        const res = await fetch(s.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-PowerCare-Signature": signature },
          body: payload,
        });
        status = res.status;
      } catch (e) {
        console.error("webhook delivery failed:", e.message);
      }
      console.log(`webhook '${event}' -> ${s.webhookUrl} (status ${status})`);
      return Response.json({ ok: status >= 200 && status < 300, status });
    }

    return Response.json({ error: "unknown action" }, { status: 400 });
  } catch (error) {
    console.error("erpApi error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});