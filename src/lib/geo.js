// High-accuracy geolocation helper shared by the attendance check-in widgets.
// A single getCurrentPosition call often returns a coarse first fix (Wi-Fi/IP based,
// hundreds of meters off) which wrongly marked employees "outside" their station.
// watchPosition keeps improving the fix and we resolve with the most accurate
// reading — early once it's good enough.
const GOOD_ACCURACY_M = 25;
// Above this, the browser fix is considered too coarse (typical for desktops
// without GPS) and we try Google's Geolocation API as a smarter fallback.
const COARSE_ACCURACY_M = 300;

import { base44 } from "@/api/base44Client";
import { getSession, getCompanyToken } from "@/lib/store";

// Paid Google lookup — called only when the free browser fix is missing/coarse.
async function googleFallback() {
  try {
    const s = getSession();
    if (!s?.companyId) return null;
    const res = await base44.functions.invoke("googleGeolocate", {
      companyId: s.companyId,
      sessionToken: getCompanyToken(s.companyId),
    });
    const d = res?.data;
    if (d?.lat != null && d?.lng != null) return { lat: d.lat, lng: d.lng, accuracy: d.accuracy ?? null };
  } catch {
    // fallback unavailable — keep whatever the browser gave us
  }
  return null;
}

/* ----------------------------- warm-fix cache -----------------------------
   startGeoWarmup() runs a short background GPS watch (e.g. when the attendance
   card appears) and caches the best fix. If a fresh, accurate fix is already
   cached when the user taps check-in, we use it instantly — zero wait. */
let warmFix = null;
let warmAt = 0;
export function startGeoWarmup(durationMs = 30000) {
  if (typeof navigator === "undefined" || !navigator.geolocation) return;
  let watchId = null;
  const stop = () => { if (watchId != null) navigator.geolocation.clearWatch(watchId); };
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy ?? null };
      if (!warmFix || (fix.accuracy != null && (warmFix.accuracy == null || fix.accuracy < warmFix.accuracy))) {
        warmFix = fix;
        warmAt = Date.now();
      }
      if (fix.accuracy != null && fix.accuracy <= GOOD_ACCURACY_M) { warmAt = Date.now(); stop(); }
    },
    () => stop(),
    { enableHighAccuracy: true, maximumAge: 0 }
  );
  setTimeout(stop, durationMs);
}

export async function getAccuratePosition({ timeoutMs = 10000 } = {}) {
  // Fresh, accurate warm fix already in hand → instant check-in.
  if (warmFix && warmFix.accuracy != null && warmFix.accuracy <= GOOD_ACCURACY_M && Date.now() - warmAt < 60000) {
    return warmFix;
  }
  const browserFix = await getBrowserPosition({ timeoutMs });
  // No browser fix means the user denied (or has no) location access — never
  // substitute a network-based guess; location permission is mandatory.
  if (!browserFix) return null;
  // Good browser fix → done, no paid call.
  if (browserFix.accuracy != null && browserFix.accuracy <= COARSE_ACCURACY_M) return browserFix;
  const googleFix = await googleFallback();
  if (!googleFix) return browserFix;
  // Both available — keep the more accurate one.
  const bAcc = browserFix.accuracy ?? Infinity;
  const gAcc = googleFix.accuracy ?? Infinity;
  return gAcc < bAcc ? googleFix : browserFix;
}

function getBrowserPosition({ timeoutMs = 20000 } = {}) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    let best = null;
    let watchId = null;
    let timer = null;
    const finish = () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      resolve(best);
    };
    timer = setTimeout(finish, timeoutMs);
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy ?? null };
        if (!best || (fix.accuracy != null && (best.accuracy == null || fix.accuracy < best.accuracy))) best = fix;
        if (best.accuracy != null && best.accuracy <= GOOD_ACCURACY_M) finish();
      },
      () => finish(), // denied/unavailable — resolve with whatever we already have (or null)
      { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs }
    );
  });
}