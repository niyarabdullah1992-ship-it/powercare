// High-accuracy geolocation helper shared by the attendance check-in widgets.
// A single getCurrentPosition call often returns a coarse first fix (Wi-Fi/IP based,
// hundreds of meters off) which wrongly marked employees "outside" their station.
// watchPosition keeps improving the fix and we resolve with the most accurate
// reading — early once it's good enough.
const GOOD_ACCURACY_M = 25;
// Attendance must use the employee device's GPS. Network/IP fixes can point to
// a completely different place, so readings coarser than this are rejected.
const MAX_ACCEPTABLE_ACCURACY_M = 100;

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
  if (warmFix && warmFix.accuracy != null && warmFix.accuracy <= GOOD_ACCURACY_M && Date.now() - warmAt < 10000) {
    return warmFix;
  }
  const browserFix = await getBrowserPosition({ timeoutMs });
  // Never substitute an IP/server location for the employee's device location.
  // If the device cannot provide a sufficiently precise reading, check-in stops.
  if (!browserFix || browserFix.accuracy == null || browserFix.accuracy > MAX_ACCEPTABLE_ACCURACY_M) return null;
  return browserFix;
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