// Smart form memory — remembers the user's last choices per form so new
// entries start pre-filled with what they usually pick.
const STORAGE_KEY = "powercare_smart_defaults";

function readAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

export function loadSmartDefaults(formKey) {
  return readAll()[formKey] || null;
}

export function saveSmartDefaults(formKey, values) {
  const all = readAll();
  all[formKey] = { ...(all[formKey] || {}), ...values };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}