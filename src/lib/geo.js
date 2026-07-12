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

// Paid Google lookup — called only when the free browser fix is missing/coarse.
async function googleFallback() {
  try {
    const res = await base44.functions.invoke("googleGeolocate", {});
    const d = res?.data;
    if (d?.lat != null && d?.lng != null) return { lat: d.lat, lng: d.lng, accuracy: d.accuracy ?? null };
  } catch {
    // fallback unavailable — keep whatever the browser gave us
  }
  return null;
}

export async function getAccuratePosition({ timeoutMs = 10000 } = {}) {
  const browserFix = await getBrowserPosition({ timeoutMs });
  // Good browser fix → done, no paid call.
  if (browserFix && browserFix.accuracy != null && browserFix.accuracy <= COARSE_ACCURACY_M) return browserFix;
  const googleFix = await googleFallback();
  if (!googleFix) return browserFix;
  if (!browserFix) return googleFix;
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