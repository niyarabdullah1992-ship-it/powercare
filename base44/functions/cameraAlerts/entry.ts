import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { createMimeMessage } from 'npm:mimetext@3.0.24';
import { authPowerCareSession } from '../../shared/powerCareSession.ts';

const clean = (value, max = 500) => String(value || '').trim().slice(0, max);
const toBase64Url = (value) => {
  const bytes = new TextEncoder().encode(value); let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

async function sendAlertEmail(base44, recipient, alert, cameraName, stationName) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
  const profile = profileResponse.ok ? await profileResponse.json() : null;
  if (!profile?.email) throw new Error('Gmail sender unavailable');
  const subject = `PowerCare — تنبيه حركة غير معتادة · ${cameraName}`;
  const text = `تنبيه أمني جديد\nالكاميرا: ${cameraName}\nالمحطة: ${stationName}\nالحدث: ${alert.eventType}\nالثقة: ${alert.confidence == null ? '—' : Math.round(alert.confidence * 100) + '%'}\nالوقت: ${alert.occurredAt}\n\nUnusual camera activity was detected. Open PowerCare Camera Center for details.`;
  const message = createMimeMessage();
  message.setSender({ name: 'PowerCare Security', addr: profile.email });
  message.setRecipient(recipient.email); message.setSubject(subject);
  message.addMessage({ contentType: 'text/plain', data: text });
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ raw: toBase64Url(message.asRaw()) }) });
  if (!response.ok) throw new Error(`Gmail send failed: ${response.status}`);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    if (body.action === 'list' || body.action === 'acknowledge') {
      const actor = await authPowerCareSession(base44, body.companyId, body.sessionToken);
      if (!actor || (!actor.admin && actor.role !== 'ops_manager')) return Response.json({ error: 'Forbidden' }, { status: 403 });
      if (body.action === 'acknowledge') {
        const rows = await base44.asServiceRole.entities.CameraAlert.filter({ id: clean(body.alertId, 100), companyId: body.companyId });
        if (!rows[0]) return Response.json({ error: 'Alert not found' }, { status: 404 });
        await base44.asServiceRole.entities.CameraAlert.update(rows[0].id, { status: 'acknowledged', acknowledgedBy: actor.name, acknowledgedAt: new Date().toISOString() });
        return Response.json({ ok: true });
      }
      const alerts = await base44.asServiceRole.entities.CameraAlert.filter({ companyId: body.companyId }, '-occurredAt', 50);
      return Response.json({ alerts });
    }

    const url = new URL(req.url);
    const suppliedSecret = url.searchParams.get('secret') || body.webhookSecret;
    if (!suppliedSecret || suppliedSecret !== Deno.env.get('CAMERA_ALERT_WEBHOOK_SECRET')) return Response.json({ error: 'Unauthorized webhook' }, { status: 401 });
    const companyId = clean(body.companyId, 100); const cameraId = clean(body.cameraId, 100);
    const eventType = clean(body.eventType || 'unusual_motion', 120);
    if (!companyId || !cameraId) return Response.json({ error: 'companyId and cameraId are required' }, { status: 400 });
    const companyRows = await base44.asServiceRole.entities.CompanyAccount.filter({ companyId });
    if (!companyRows[0]) return Response.json({ error: 'Company not found' }, { status: 404 });
    const cameraBlobs = await base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId, category: 'cameras' });
    const camera = (cameraBlobs[0]?.payload || []).find((item) => item.id === cameraId);
    if (!camera) return Response.json({ error: 'Camera not found' }, { status: 404 });
    const externalEventId = clean(body.externalEventId, 160) || null;
    if (externalEventId) {
      const duplicate = await base44.asServiceRole.entities.CameraAlert.filter({ companyId, externalEventId });
      if (duplicate[0]) return Response.json({ ok: true, duplicate: true, alertId: duplicate[0].id });
    }
    const occurredAt = Number.isFinite(new Date(body.occurredAt).getTime()) ? new Date(body.occurredAt).toISOString() : new Date().toISOString();
    const confidenceValue = Number(body.confidence); const confidence = Number.isFinite(confidenceValue) ? Math.min(1, Math.max(0, confidenceValue)) : null;
    const snapshotValue = clean(body.snapshotUrl, 2000); const snapshotUrl = /^https:\/\//i.test(snapshotValue) ? snapshotValue : null;
    const alert = await base44.asServiceRole.entities.CameraAlert.create({ companyId, cameraId, stationId: camera.stationId || null, eventType, confidence, description: clean(body.description, 1000), snapshotUrl, externalEventId, occurredAt, status: 'new', acknowledgedBy: null, acknowledgedAt: null });
    const [recipients, stations] = await Promise.all([base44.asServiceRole.entities.Employee.filter({ companyId, role: 'ops_manager' }), base44.asServiceRole.entities.Station.filter({ companyId })]);
    const stationName = stations.find((item) => item.stationId === camera.stationId)?.name || '—';
    const message = `🚨 Camera alert: unusual motion at ${camera.name || cameraId} — ${stationName}`;
    const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').replace(/\/+$/, '').replace(/\/rest\/v\d+$/, '');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (supabaseUrl && supabaseKey) await Promise.all(recipients.map((recipient) => fetch(`${supabaseUrl}/rest/v1/notifications`, { method: 'POST', headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: recipient.employeeId, message }) })));
    const emailResults = await Promise.allSettled(recipients.filter((item) => item.email).map((recipient) => sendAlertEmail(base44, recipient, alert, camera.name || cameraId, stationName)));
    emailResults.filter((result) => result.status === 'rejected').forEach((result) => console.error('Camera alert email failed:', result.reason?.message));
    return Response.json({ ok: true, alertId: alert.id, recipients: recipients.length });
  } catch (error) {
    console.error('cameraAlerts error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});