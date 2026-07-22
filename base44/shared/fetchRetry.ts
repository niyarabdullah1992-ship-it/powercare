export async function fetchWithRetry(input, init = {}, attempts = 3) {
  let response = null;
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      response = await fetch(input, init);
      if (response.ok || (response.status !== 429 && response.status < 500)) return response;
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 350 * (2 ** attempt)));
  }
  if (response) return response;
  throw lastError || new Error('Network request failed');
}