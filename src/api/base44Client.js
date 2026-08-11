import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// Security: these backend functions authorize every call server-side using the
// per-company session token issued at login. Attach it automatically so no page
// has to (and no page can forge a role — the server derives it from the session).
const SESSION_SECURED_FUNCTIONS = new Set(['supabaseAttendance', 'supabaseTargets', 'operations', 'workforce', 'scores', 'workproof', 'dailyReport', 'multiSign', 'calendarSync', 'cameraConnectionTest']);
const powercareFunctions = base44.functions;
const rawInvoke = powercareFunctions.invoke.bind(powercareFunctions);
powercareFunctions.invoke = (name, payload, ...rest) => {
  if (SESSION_SECURED_FUNCTIONS.has(name)) {
    try {
      const session = JSON.parse(localStorage.getItem('powercare_session') || 'null');
      const tokens = JSON.parse(localStorage.getItem('powercare_tokens') || '{}');
      const companyId = (payload && payload.companyId) || session?.companyId;
      if (companyId) {
        payload = { ...(payload || {}), companyId, sessionToken: tokens[companyId] || null };
      }
    } catch {
      // no session yet — the backend rejects unauthorized calls
    }
  }
  return rawInvoke(name, payload, ...rest);
};