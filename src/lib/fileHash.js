// SHA-256 helpers (browser WebCrypto) — used to fingerprint signed documents.
export async function sha256HexOfBuffer(buf) {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256HexOfFile(fileOrBlob) {
  return sha256HexOfBuffer(await fileOrBlob.arrayBuffer());
}

export async function sha256HexOfUrl(url) {
  const buf = await fetch(url).then((r) => r.arrayBuffer());
  return sha256HexOfBuffer(buf);
}