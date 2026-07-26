import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { authPowerCareSession } from "../../shared/powerCareSession.ts";

const privateHost = (host) => host === "localhost" || host === "::1" || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const auth = await authPowerCareSession(base44, body.companyId, body.sessionToken);
    if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!auth.admin && !auth.owner && !["director", "ops_manager", "pgm", "station_manager"].includes(auth.role)) return Response.json({ error: "Forbidden" }, { status: 403 });
    if (body.streamType === "rtsp" || String(body.url || "").startsWith("rtsp://")) return Response.json({ ok: false, message: "RTSP requires an on-site RTSP-to-HLS gateway before browser playback." });
    let url;
    try { url = new URL(String(body.url || "")); } catch { return Response.json({ ok: false, message: "Invalid stream URL." }, { status: 400 }); }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return Response.json({ ok: false, message: "Use an HTTP(S) URL without embedded credentials." }, { status: 400 });
    if (privateHost(url.hostname)) return Response.json({ ok: false, message: "Local streams must be tested and converted by the on-site gateway." });
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(url.toString(), { method: "GET", headers: { Range: "bytes=0-1023" }, redirect: "manual", signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok && response.status !== 206) return Response.json({ ok: false, message: `Stream endpoint returned HTTP ${response.status}.` });
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("application/json")) return Response.json({ ok: false, message: "The URL returned an API error instead of a camera stream." });
    return Response.json({ ok: true, message: "Stream endpoint is reachable." });
  } catch (error) {
    console.error("Camera connection test failed:", error.message);
    return Response.json({ ok: false, message: error.name === "AbortError" ? "Connection timed out." : "Stream endpoint could not be reached." });
  }
}