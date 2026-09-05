// Generic HTTP phrases a backend returns as its error body. They read as noise
// to an operator, so a surface-specific reason is shown instead of echoing them.
const GENERIC_PHRASES = new Set([
  "unauthorized",
  "forbidden",
  "not found",
  "bad request",
  "internal server error",
  "service unavailable",
  "network error",
]);

function isGeneric(text) {
  const value = String(text || "").trim().toLowerCase();
  if (!value) return true;
  if (GENERIC_PHRASES.has(value)) return true;
  return /^request failed with status code \d+$/.test(value);
}

/**
 * Prefers a meaningful message from the server; falls back to a caller-supplied
 * reason that names the surface and what it is holding.
 */
export function namedServiceReason(error, ar, fallback) {
  const fromServer = error?.response?.data?.error || error?.message;
  if (!isGeneric(fromServer)) return fromServer;
  return ar ? fallback.ar : fallback.en;
}
