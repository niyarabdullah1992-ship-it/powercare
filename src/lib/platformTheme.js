/**
 * Official platform color themes — navy + one accent.
 * Status colors (present/absent) stay semantic and are not restyled here.
 */

export const DEFAULT_NAVY = "#14284B";
export const DEFAULT_ACCENT = "#1E9E63";

export const PLATFORM_THEMES = [
  {
    id: "nirovera",
    labelAr: "نيرافيرا",
    labelEn: "NiroVera",
    navy: DEFAULT_NAVY,
    accent: DEFAULT_ACCENT,
  },
  {
    id: "deepNavy",
    labelAr: "كحلي عميق",
    labelEn: "Deep navy",
    navy: "#0B1C36",
    accent: "#0F8A80",
  },
  {
    id: "corporateGray",
    labelAr: "رمادي مؤسسي",
    labelEn: "Corporate gray",
    navy: "#2F3A47",
    accent: "#3E8A64",
  },
  {
    id: "ksaGreen",
    labelAr: "أخضر المملكة",
    labelEn: "Kingdom green",
    navy: DEFAULT_NAVY,
    accent: "#147A4B",
  },
];

export const DEFAULT_THEME = PLATFORM_THEMES[0];

export const THEME_STORAGE_KEY = "powercare_color_theme";
export const THEME_CHANGE_EVENT = "powercare:color-theme";

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function isHexColor(value) {
  return HEX.test(String(value || "").trim());
}

export function companyThemeKey(companyId) {
  return `${THEME_STORAGE_KEY}:${companyId}`;
}

export function canEditPlatformTheme(currentUser, data) {
  if (!currentUser) return false;
  if (data?.ownerId && data.ownerId === currentUser.id) return true;
  return ["owner", "admin", "director", "ops_manager"].includes(currentUser.role);
}

function matchPreset(navy, accent) {
  return PLATFORM_THEMES.find(
    (preset) => preset.navy.toUpperCase() === navy && preset.accent.toUpperCase() === accent,
  );
}

export function normalizeTheme(input) {
  const raw = input && typeof input === "object" ? input : {};
  const navy = isHexColor(raw.navy) ? String(raw.navy).trim().toUpperCase() : DEFAULT_NAVY;
  const accent = isHexColor(raw.accent) ? String(raw.accent).trim().toUpperCase() : DEFAULT_ACCENT;
  const preset = matchPreset(navy, accent);
  const requested = String(raw.id || "").trim();
  const id = preset?.id || (requested && requested !== "nirovera" ? "custom" : "nirovera");
  return { id, navy, accent };
}

export function applyPlatformTheme(theme) {
  if (typeof document === "undefined") return normalizeTheme(theme);
  const next = normalizeTheme(theme);
  const root = document.documentElement;
  root.style.setProperty("--nv-navy", next.navy);
  root.style.setProperty("--nv-accent", next.accent);
  root.dataset.nvTheme = next.id;
  return next;
}

function readJson(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function readStoredTheme(companyId) {
  if (companyId) {
    const scoped = readJson(companyThemeKey(companyId));
    if (scoped) return normalizeTheme(scoped);
  }
  const last = readJson(THEME_STORAGE_KEY);
  return last ? normalizeTheme(last) : { ...DEFAULT_THEME };
}

export function persistPlatformTheme(theme, companyId) {
  const next = normalizeTheme(theme);
  if (typeof window === "undefined") return next;
  try {
    const payload = JSON.stringify(next);
    localStorage.setItem(THEME_STORAGE_KEY, payload);
    if (companyId) localStorage.setItem(companyThemeKey(companyId), payload);
  } catch {
    /* private mode */
  }
  return next;
}

export function applyStoredPlatformTheme(companyId) {
  return applyPlatformTheme(readStoredTheme(companyId));
}

export function publishPlatformTheme(theme, companyId) {
  const next = persistPlatformTheme(theme, companyId);
  applyPlatformTheme(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: next }));
  }
  return next;
}
