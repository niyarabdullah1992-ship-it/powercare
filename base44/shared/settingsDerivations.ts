/** Company Settings — station geofences, company record gates, owner geo switch.
 *  Design: NiroVera Platform.dc.html (settings / geoTitle / geoReq / companyRows).
 *  Permission matrix + temporary delegation live in orgDerivations — do not duplicate.
 *  Anonymous rate limits (3/10/30) live in complaintDerivations — expose read-only here.
 */

import { DEFAULT_RATE_LIMITS, type RateLimits } from "./complaintDerivations.ts";

export const DEFAULT_RADIUS_METERS = 200;
export const MIN_RADIUS_METERS = 50;
export const MAX_RADIUS_METERS = 5000;

/** Saudi CR: 10 digits. */
const CR_RE = /^\d{10}$/;
/** VAT: 15 digits, typically starts with 3. */
const VAT_RE = /^3\d{14}$/;
/** Qiwa establishment: digit(s)-digits, e.g. 7-1104829. */
const QIWA_RE = /^\d{1,2}-\d{5,10}$/;
/** Email domain: @host.tld or host.tld. */
const DOMAIN_RE = /^@?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

export type VerificationMode = "geofence_proof" | "self_declaration";

export type CompanyRecord = {
  name?: string | null;
  commercialRegistration?: string | null;
  vatNumber?: string | null;
  qiwaEstablishment?: string | null;
  allowedEmailDomain?: string | null;
  activeUsers?: number | null;
  seatLimit?: number | null;
};

export type StationGeofenceLike = {
  id?: string;
  stationId?: string;
  name?: string | null;
  code?: string | null;
  lat?: number | null;
  lng?: number | null;
  radiusMeters?: number | null;
  crew?: number | null;
};

export type GateResult =
  | { ok: true; [key: string]: unknown }
  | {
      ok: false;
      error: string;
      reason: string;
      reasonEn: string;
      [key: string]: unknown;
    };

export type GeoVerdict = "inside" | "outside" | "unchecked" | "self_declaration";

export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parseCoord(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n)) return null;
  return n;
}

export function isValidLat(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function isValidLng(lng: number): boolean {
  return Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

export function normalizeRadius(raw: unknown, fallback = DEFAULT_RADIUS_METERS): number {
  const n = parseCoord(raw);
  if (n == null) return fallback;
  return Math.round(n);
}

export function normalizeEmailDomain(raw: unknown): string {
  let v = String(raw ?? "").trim().toLowerCase();
  if (!v) return "";
  if (!v.startsWith("@")) v = `@${v}`;
  return v;
}

export function normalizeCompanyRecord(raw?: Partial<CompanyRecord> | null): CompanyRecord {
  return {
    name: raw?.name != null ? String(raw.name).trim() : "",
    commercialRegistration: raw?.commercialRegistration != null
      ? String(raw.commercialRegistration).trim()
      : "",
    vatNumber: raw?.vatNumber != null ? String(raw.vatNumber).trim() : "",
    qiwaEstablishment: raw?.qiwaEstablishment != null
      ? String(raw.qiwaEstablishment).trim()
      : "",
    allowedEmailDomain: normalizeEmailDomain(raw?.allowedEmailDomain),
    activeUsers: raw?.activeUsers != null && Number.isFinite(Number(raw.activeUsers))
      ? Number(raw.activeUsers)
      : null,
    seatLimit: raw?.seatLimit != null && Number.isFinite(Number(raw.seatLimit))
      ? Number(raw.seatLimit)
      : null,
  };
}

/** Owner switch: when false, check-in is a self-declaration, not proof. */
export function deriveVerificationMode(geofenceVerificationRequired: boolean): {
  geofenceVerificationRequired: boolean;
  verificationMode: VerificationMode;
  checkInIsProof: boolean;
  wordingAr: string;
  wordingEn: string;
  statusAr: string;
  statusEn: string;
  noteAr: string;
  noteEn: string;
} {
  const on = geofenceVerificationRequired !== false;
  if (on) {
    return {
      geofenceVerificationRequired: true,
      verificationMode: "geofence_proof",
      checkInIsProof: true,
      wordingAr: "التحقق عبر الموقع الجغرافي للفرع",
      wordingEn: "Verified against the station geofence",
      statusAr: "مفعّل — لا يُقبل تسجيل خارج نطاق الفرع إلا بمراجعة",
      statusEn: "On — a check-in outside the station radius needs review",
      noteAr:
        "قرار لمالك الحساب وحده. إيقافه يجعل التسجيل إقرارًا من الموظف لا إثباتًا.",
      noteEn:
        "The account owner's decision alone. Turning it off makes a check-in a self-declaration rather than proof.",
    };
  }
  return {
    geofenceVerificationRequired: false,
    verificationMode: "self_declaration",
    checkInIsProof: false,
    wordingAr: "تسجيل يدوي — إقرار من الموظف لا إثبات موقع",
    wordingEn: "Manual entry — employee self-declaration, not location proof",
    statusAr: "موقوف — التسجيل يدوي بلا تحقق من الموقع",
    statusEn: "Off — check-in is manual with no location check",
    noteAr:
      "التسجيل إقرار ذاتي؛ يرتفع وزن شهادة المشرف وإثبات العمل المختوم. الحضور ليس بندًا في درجة الأداء.",
    noteEn:
      "Check-in is a self-declaration; supervisor attestation and stamped work proof carry the weight. Attendance is not a performance score term.",
  };
}

export function checkCompanyRecordGate(input: Partial<CompanyRecord>): GateResult {
  const rec = normalizeCompanyRecord(input);
  if (rec.commercialRegistration && !CR_RE.test(rec.commercialRegistration)) {
    return {
      ok: false,
      error: "INVALID_CR",
      reason: "السجل التجاري يجب أن يكون 10 أرقام.",
      reasonEn: "Commercial registration must be exactly 10 digits.",
    };
  }
  if (rec.vatNumber && !VAT_RE.test(rec.vatNumber)) {
    return {
      ok: false,
      error: "INVALID_VAT",
      reason: "الرقم الضريبي يجب أن يكون 15 رقمًا ويبدأ بـ 3.",
      reasonEn: "VAT number must be 15 digits starting with 3.",
    };
  }
  if (rec.qiwaEstablishment && !QIWA_RE.test(rec.qiwaEstablishment)) {
    return {
      ok: false,
      error: "INVALID_QIWA_ESTABLISHMENT",
      reason: "رقم المنشأة في قوى بصيغة غير صالحة (مثال: 7-1104829).",
      reasonEn: "Qiwa establishment number format is invalid (e.g. 7-1104829).",
    };
  }
  if (rec.allowedEmailDomain && !DOMAIN_RE.test(rec.allowedEmailDomain)) {
    return {
      ok: false,
      error: "INVALID_EMAIL_DOMAIN",
      reason: "النطاق البريدي المسموح غير صالح.",
      reasonEn: "Allowed email domain is invalid.",
    };
  }
  return { ok: true, record: rec };
}

export function checkGeofenceConfigGate(input: {
  lat?: unknown;
  lng?: unknown;
  radiusMeters?: unknown;
}): GateResult {
  const lat = parseCoord(input.lat);
  const lng = parseCoord(input.lng);
  if (lat == null || lng == null) {
    return {
      ok: false,
      error: "INVALID_COORDS",
      reason: "إحداثيات الفرع غير صالحة أو ناقصة.",
      reasonEn: "Station coordinates are missing or invalid.",
    };
  }
  if (!isValidLat(lat) || !isValidLng(lng)) {
    return {
      ok: false,
      error: "INVALID_COORDS",
      reason: "خط العرض يجب أن يكون بين −90 و90، وخط الطول بين −180 و180.",
      reasonEn: "Latitude must be −90…90 and longitude −180…180.",
    };
  }
  const radius = normalizeRadius(input.radiusMeters);
  if (radius < MIN_RADIUS_METERS || radius > MAX_RADIUS_METERS) {
    return {
      ok: false,
      error: "INVALID_RADIUS",
      reason: `نصف القطر يجب أن يكون بين ${MIN_RADIUS_METERS} و${MAX_RADIUS_METERS} مترًا.`,
      reasonEn: `Radius must be between ${MIN_RADIUS_METERS} and ${MAX_RADIUS_METERS} meters.`,
    };
  }
  return { ok: true, lat, lng, radiusMeters: radius };
}

/**
 * Gate a check-in or work-proof capture against the station geofence.
 * When verification is off → self_declaration (accepted, not proof).
 */
export function checkLocationAgainstGeofence(input: {
  geofenceVerificationRequired?: boolean;
  station?: StationGeofenceLike | null;
  lat?: unknown;
  lng?: unknown;
  /** For work proof / attendance: require coords when verification is on. */
  requireCoordsWhenOn?: boolean;
}): GateResult {
  const mode = deriveVerificationMode(input.geofenceVerificationRequired !== false);
  if (!mode.geofenceVerificationRequired) {
    return {
      ok: true,
      verdict: "self_declaration" as GeoVerdict,
      verificationMode: mode.verificationMode,
      checkInIsProof: false,
      distanceMeters: null,
      discardedCoords: true,
    };
  }

  const lat = parseCoord(input.lat);
  const lng = parseCoord(input.lng);
  const requireCoords = input.requireCoordsWhenOn !== false;

  if (lat == null || lng == null) {
    if (!requireCoords) {
      return {
        ok: true,
        verdict: "unchecked" as GeoVerdict,
        verificationMode: mode.verificationMode,
        checkInIsProof: true,
        distanceMeters: null,
      };
    }
    return {
      ok: false,
      error: "GEOFENCE_REQUIRED",
      reason: "التحقق بالموقع مفعّل — يلزم إحداثيات التسجيل.",
      reasonEn: "Geofence verification is on — check-in coordinates are required.",
      verificationMode: mode.verificationMode,
    };
  }

  if (!isValidLat(lat) || !isValidLng(lng)) {
    return {
      ok: false,
      error: "INVALID_COORDS",
      reason: "إحداثيات التسجيل غير صالحة.",
      reasonEn: "Submitted coordinates are invalid.",
      verificationMode: mode.verificationMode,
    };
  }

  const station = input.station;
  const sLat = parseCoord(station?.lat);
  const sLng = parseCoord(station?.lng);
  if (sLat == null || sLng == null || !isValidLat(sLat) || !isValidLng(sLng)) {
    return {
      ok: false,
      error: "GEOFENCE_NOT_CONFIGURED",
      reason: "نطاق الفرع الجغرافي غير مضبوط بعد.",
      reasonEn: "Station geofence is not configured yet.",
      verificationMode: mode.verificationMode,
    };
  }

  const radius = normalizeRadius(station?.radiusMeters);
  const dist = Math.round(distanceMeters(lat, lng, sLat, sLng));
  if (dist > radius) {
    return {
      ok: false,
      error: "OUTSIDE_GEOFENCE",
      reason: "التسجيل خارج نطاق الفرع — يلزم قبول بمبرر أو رفض.",
      reasonEn: "Outside the station geofence — accept with a reason or reject.",
      verificationMode: mode.verificationMode,
      verdict: "outside" as GeoVerdict,
      distanceMeters: dist,
      radiusMeters: radius,
      /** Privacy: only verdict survives; callers must discard raw coords. */
      discardedCoords: true,
    };
  }

  return {
    ok: true,
    verdict: "inside" as GeoVerdict,
    verificationMode: mode.verificationMode,
    checkInIsProof: true,
    distanceMeters: dist,
    radiusMeters: radius,
    discardedCoords: true,
  };
}

export function enrichGeofenceRow(
  station: StationGeofenceLike,
  opts?: { crew?: number | null },
): {
  id: string;
  stationId: string;
  name: string;
  code: string;
  lat: number | null;
  lng: number | null;
  radiusMeters: number;
  coordsLabel: string;
  radiusLabelAr: string;
  radiusLabelEn: string;
  configured: boolean;
  crew: number | null;
} {
  const id = String(station.stationId || station.id || "");
  const lat = parseCoord(station.lat);
  const lng = parseCoord(station.lng);
  const radius = normalizeRadius(station.radiusMeters);
  const configured =
    lat != null && lng != null && isValidLat(lat) && isValidLng(lng);
  return {
    id,
    stationId: id,
    name: String(station.name || id || "—"),
    code: String(station.code || id || "—"),
    lat: configured ? lat : null,
    lng: configured ? lng : null,
    radiusMeters: radius,
    coordsLabel: configured
      ? `${lat!.toFixed(4)}, ${lng!.toFixed(4)}`
      : "",
    radiusLabelAr: `${radius} متر`,
    radiusLabelEn: `${radius} m`,
    configured,
    crew: opts?.crew ?? (station.crew != null ? Number(station.crew) : null),
  };
}

export function deriveCompanyRows(record: CompanyRecord, lang: "ar" | "en" = "ar") {
  const users =
    record.activeUsers != null && record.seatLimit != null
      ? lang === "ar"
        ? `${record.activeUsers} من ${record.seatLimit}`
        : `${record.activeUsers} of ${record.seatLimit}`
      : record.activeUsers != null
        ? String(record.activeUsers)
        : "—";
  return [
    {
      key: "name",
      labelAr: "اسم المنشأة",
      labelEn: "Company name",
      value: record.name || "—",
      dir: "auto",
    },
    {
      key: "cr",
      labelAr: "السجل التجاري",
      labelEn: "Commercial registration",
      value: record.commercialRegistration || "—",
      dir: "ltr",
    },
    {
      key: "vat",
      labelAr: "الرقم الضريبي",
      labelEn: "VAT number",
      value: record.vatNumber || "—",
      dir: "ltr",
    },
    {
      key: "qiwa",
      labelAr: "رقم المنشأة في قوى",
      labelEn: "Qiwa establishment number",
      value: record.qiwaEstablishment || "—",
      dir: "ltr",
    },
    {
      key: "domain",
      labelAr: "النطاق البريدي المسموح",
      labelEn: "Allowed email domain",
      value: record.allowedEmailDomain || "—",
      dir: "ltr",
    },
    {
      key: "users",
      labelAr: "عدد المستخدمين",
      labelEn: "Active users",
      value: users,
      dir: "auto",
    },
  ];
}

/** Read-only mirror of complaints anonymous rate limits — do not invent a second source. */
export function exposeAnonymousRateLimits(
  limits?: Partial<RateLimits> | null,
): Array<{ key: "day" | "week" | "month"; labelAr: string; labelEn: string; value: number }> {
  const day = Math.max(1, Number(limits?.day ?? DEFAULT_RATE_LIMITS.day) || DEFAULT_RATE_LIMITS.day);
  const week = Math.max(1, Number(limits?.week ?? DEFAULT_RATE_LIMITS.week) || DEFAULT_RATE_LIMITS.week);
  const month = Math.max(1, Number(limits?.month ?? DEFAULT_RATE_LIMITS.month) || DEFAULT_RATE_LIMITS.month);
  return [
    { key: "day", labelAr: "بلاغات في اليوم", labelEn: "Reports per day", value: day },
    { key: "week", labelAr: "بلاغات في الأسبوع", labelEn: "Reports per week", value: week },
    { key: "month", labelAr: "بلاغات في الشهر", labelEn: "Reports per month", value: month },
  ];
}

export { DEFAULT_RATE_LIMITS };
