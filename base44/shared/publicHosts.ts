/** Public app hosts for NiroVera / PowerCare (same Base44 app, two domains). */

export const CANONICAL_APP_ORIGIN = "https://nirovera.sa";

const TRUSTED_APP_HOST_RE =
  /^([a-z0-9-]+\.)*(nirovera\.sa|powercares\.pro|base44\.app)$/i;

/** Hostnames allowed as the live app origin (signing links, checkout return). */
export function isTrustedAppHostname(hostname) {
  const host = String(hostname || "").toLowerCase();
  if (!host) return false;
  return TRUSTED_APP_HOST_RE.test(host);
}

/** True when url is https on a trusted app or media host (email CTAs). */
export function isTrustedAppOrigin(value) {
  try {
    const url = new URL(String(value || ""));
    const host = url.hostname.toLowerCase();
    const trusted = isTrustedAppHostname(host) || host === "media.base44.com";
    return (
      url.protocol === "https:"
      && trusted
      && (url.port === "" || url.port === "443")
      && url.username === ""
      && url.password === ""
    );
  } catch {
    return false;
  }
}

/** Resolve a client-supplied origin to a trusted https origin, else canonical. */
export function resolveAppOrigin(raw) {
  try {
    const url = new URL(String(raw || ""));
    if (url.protocol === "https:" && isTrustedAppHostname(url.hostname)) {
      return url.origin;
    }
  } catch {
    /* fall through */
  }
  return CANONICAL_APP_ORIGIN;
}
