/** Client mirror of base44/shared/workspaceDerivations.ts
 *  Design: NiroVera Workspace.dc.html — public tenant registry lookup.
 *  Public channel only: never exposes owner email, passwords, or employee PII.
 */

export const WORKSPACE_SEARCH_MIN = 2;
export const WORKSPACE_SEARCH_MAX = 12;

const ARABIC_MAP = {
  ا: "a",
  أ: "a",
  إ: "a",
  آ: "a",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  و: "w",
  ي: "y",
  ى: "y",
  ة: "h",
  ء: "",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

const STOP_WORDS = new Set(["شركه", "مصنع", "مؤسسه", "موسسه", "اداره", "شركة", "co", "company", "ltd"]);

/** Strip diacritics / unify hamza & taa-marbuta for approximate Arabic search. */
export function normalizeArabicQuery(value) {
  return String(value || "")
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .trim();
}

export function checkWorkspaceSearchGate(query) {
  const q = String(query || "").trim();
  if (!q) {
    return {
      ok: false,
      error: "EMPTY_QUERY",
      reason: "اكتب اسم الشركة أو رقم السجل التجاري.",
      reasonEn: "Type a company name or commercial registration number.",
    };
  }
  if (q.length < WORKSPACE_SEARCH_MIN) {
    return {
      ok: false,
      error: "QUERY_TOO_SHORT",
      reason: "أدخل حرفين على الأقل للبحث.",
      reasonEn: "Enter at least two characters to search.",
    };
  }
  return { ok: true, query: q, normalized: normalizeArabicQuery(q) };
}

export function slugifyCompanyName(name, companyId = "") {
  const id = String(companyId || "").trim();
  if (/^[a-z0-9][a-z0-9_-]{1,48}$/i.test(id)) return id.toLowerCase().replace(/_/g, "-");

  const norm = normalizeArabicQuery(name);
  const words = norm.split(/\s+/).filter((w) => w && !STOP_WORDS.has(w));
  const source = words.length ? words : norm.split(/\s+/).filter(Boolean);
  const slug = source
    .map((w) =>
      w
        .split("")
        .map((ch) => (ARABIC_MAP[ch] !== undefined ? ARABIC_MAP[ch] : /[a-z0-9]/.test(ch) ? ch : ""))
        .join(""),
    )
    .filter(Boolean)
    .join("-")
    .slice(0, 28);
  return slug || "tenant";
}

export function isWorkspaceTrial(account) {
  const plan = String(account?.plan || "").trim();
  if (!plan || /^free$/i.test(plan)) return true;
  if (/trial/i.test(plan)) return true;
  return false;
}

export function accountMatchesWorkspaceQuery(account, query, commercialRegistration = "") {
  const gate = checkWorkspaceSearchGate(query);
  if (!gate.ok) return false;
  const nq = gate.normalized;
  const name = normalizeArabicQuery(account?.name);
  const slug = normalizeArabicQuery(slugifyCompanyName(account?.name, account?.companyId));
  const cid = normalizeArabicQuery(account?.companyId);
  const cr = String(commercialRegistration || "").replace(/\D/g, "");
  const digits = gate.query.replace(/\D/g, "");
  if (name.includes(nq) || slug.includes(nq) || cid.includes(nq)) return true;
  if (digits.length >= 4 && cr && cr.includes(digits)) return true;
  return false;
}

export function derivePublicWorkspaceCard(account, extras = {}) {
  const companyId = String(account?.companyId || "").trim();
  const name = String(account?.name || "").trim() || companyId;
  const slug = slugifyCompanyName(name, companyId);
  const plan = String(account?.plan || "Starter").trim() || "Starter";
  const orgType = "company";
  const trial = isWorkspaceTrial(account);
  const sites = Number.isFinite(Number(extras.sites)) ? Number(extras.sites) : 0;
  const staff = Number.isFinite(Number(extras.staff)) ? Number(extras.staff) : 0;
  const since = extras.since
    || (account?.subscriptionStart ? String(account.subscriptionStart).slice(0, 4) : "")
    || (account?.created_date ? String(account.created_date).slice(0, 4) : "")
    || "—";
  const cr = String(extras.commercialRegistration || "").replace(/\D/g, "") || "";

  return {
    companyId,
    slug,
    name,
    orgType,
    plan,
    trial,
    sites,
    staff,
    since,
    commercialRegistration: cr || null,
    // Public path only — never ownerEmail / credentials.
    urlPath: `/workspace/${encodeURIComponent(slug)}`,
    staffLoginPath: `/login/company?company=${encodeURIComponent(companyId)}`,
    careersPath: `/careers?company=${encodeURIComponent(companyId)}`,
  };
}

/** Local preview seeds when Base44 is offline — mirrors design SEED, not live data. */
export function workspacePreviewSeeds(lang = "ar") {
  const ar = lang === "ar";
  const T = (a, e) => (ar ? a : e);
  return [
    {
      companyId: "gulf-power",
      name: T("شركة الخليج للطاقة", "Gulf Power Co."),
      plan: T("الخطة المؤسسية", "Enterprise"),
      orgType: "company",
      subscriptionStart: "2024-01-01",
      created_date: "2024-01-01",
      _cr: "1010234567",
      _sites: 6,
      _staff: 142,
    },
    {
      companyId: "yanbu-petro",
      name: T("مصنع ينبع للبتروكيماويات", "Yanbu Petrochemical Plant"),
      plan: T("خطة النمو", "Growth"),
      orgType: "company",
      subscriptionStart: "2025-01-01",
      created_date: "2025-01-01",
      _cr: "4700118822",
      _sites: 3,
      _staff: 88,
    },
    {
      companyId: "rabigh-fm",
      name: T("إدارة مرافق رابغ", "Rabigh Facilities Management"),
      plan: "Starter",
      orgType: "company",
      subscriptionStart: "2026-01-01",
      created_date: "2026-01-01",
      _cr: "4602277431",
      _sites: 2,
      _staff: 41,
      _forceTrial: true,
    },
  ].map((row) => {
    const card = derivePublicWorkspaceCard(row, {
      commercialRegistration: row._cr,
      sites: row._sites,
      staff: row._staff,
      since: String(row.subscriptionStart).slice(0, 4),
    });
    if (row._forceTrial) card.trial = true;
    return card;
  });
}

export function filterWorkspacePreview(query, lang = "ar") {
  const gate = checkWorkspaceSearchGate(query);
  if (!gate.ok) return { ok: false, ...gate, results: [] };
  const seeds = workspacePreviewSeeds(lang);
  const results = seeds
    .filter((c) =>
      accountMatchesWorkspaceQuery(
        { name: c.name, companyId: c.companyId, plan: c.plan },
        gate.query,
        c.commercialRegistration || "",
      ))
    .slice(0, WORKSPACE_SEARCH_MAX);
  return { ok: true, query: gate.query, results, preview: true };
}
