// Resolves a station's map position automatically:
// 1. Explicit lat/lng set via the location editor.
// 2. Coordinates typed in the free-text "location" field (e.g. "24.71, 46.67").
// 3. City/place name in the "location" field — geocoded once via OpenStreetMap
//    and cached in localStorage so it never re-fetches.
const CACHE_KEY = "powercare_geocode_cache_v1";

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; }
}

function parseCoords(text) {
  const m = String(text || "").match(/(-?\d{1,3}\.\d+)\s*[,،]\s*(-?\d{1,3}\.\d+)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

async function geocodeName(name) {
  const cache = readCache();
  if (name in cache) return cache[name];
  let result = null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(name)}`,
      { headers: { "Accept-Language": "en" } }
    );
    const rows = await res.json();
    if (rows?.[0]) result = { lat: parseFloat(rows[0].lat), lng: parseFloat(rows[0].lon) };
  } catch { /* offline — stays unresolved this session */ }
  cache[name] = result; // cache misses too, to avoid hammering the API
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* storage full */ }
  return result;
}

// Returns [{...station, lat, lng}] for every station that could be located.
export async function resolveStationPositions(stations) {
  const out = [];
  for (const s of stations) {
    if (s.lat != null && s.lng != null) { out.push(s); continue; }
    const typed = parseCoords(s.location);
    if (typed) { out.push({ ...s, ...typed }); continue; }
    if (s.location && String(s.location).trim()) {
      const geo = await geocodeName(String(s.location).trim());
      if (geo) out.push({ ...s, ...geo });
    }
  }
  return out;
}