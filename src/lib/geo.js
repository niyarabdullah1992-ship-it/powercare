// High-accuracy geolocation helper shared by the attendance check-in widgets.
// A single getCurrentPosition call often returns a coarse first fix (Wi-Fi/IP based,
// hundreds of meters off) which wrongly marked employees "outside" their station.
// watchPosition keeps improving the fix and we resolve with the most accurate
// reading — early once it's good enough.
const GOOD_ACCURACY_M = 30;

export function getAccuratePosition({ timeoutMs = 12000 } = {}) {
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