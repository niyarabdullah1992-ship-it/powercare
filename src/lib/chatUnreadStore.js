const listeners = new Set();
let total = 0;

function seenKey(companyId, userId) {
  return `nv_chat_seen_${companyId || "co"}_${userId || "u"}`;
}

export function getChatSeenMap(companyId, userId) {
  try {
    const raw = localStorage.getItem(seenKey(companyId, userId));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function markChatSeen(companyId, userId, threadKey, at = new Date().toISOString()) {
  if (!threadKey) return;
  const map = getChatSeenMap(companyId, userId);
  map[String(threadKey)] = at;
  try {
    localStorage.setItem(seenKey(companyId, userId), JSON.stringify(map));
  } catch {
    // ignore quota
  }
}

export function threadIsUnread(thread, seenAt, myId) {
  if (!thread?.lastAt) return false;
  if (thread.fromId && String(thread.fromId) === String(myId || "")) return false;
  const last = Date.parse(thread.lastAt);
  if (!Number.isFinite(last)) return false;
  const seen = seenAt ? Date.parse(seenAt) : 0;
  return !seen || last > seen;
}

export function getChatUnreadTotal() {
  return total;
}

export function setChatUnreadTotal(next) {
  const value = Math.max(0, Number(next) || 0);
  if (value === total) return;
  total = value;
  listeners.forEach((fn) => fn(total));
}

export function subscribeChatUnread(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
