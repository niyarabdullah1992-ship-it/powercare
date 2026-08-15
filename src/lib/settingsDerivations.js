/** Client mirror of base44/shared/settingsDerivations.ts
 *  Keep in sync — Settings / station geofences / company record / owner geo switch.
 *  Anonymous rate limits (3/10/30) are imported from complaintDerivations — do not duplicate.
 */

import { DEFAULT_RATE_LIMITS } from "./complaintDerivations.js";

export { DEFAULT_RATE_LIMITS };

export const DEFAULT_RADIUS_METERS = 200;
export const MIN_RADIUS_METERS = 50;
export const MAX_RADIUS_METERS = 5000;

const CR_RE = /^\d{10}$/;
const VAT_RE = /^3\d{14}$/;
const QIWA_RE = /^\d{1,2}-\d{5,10}$/;
const DOMAIN_RE = /^@?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6_371_000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parseCoord(raw) {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n)) return null;
  return n;
}

export function isValidLat(lat) {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function isValidLng(lng) {
  return Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

export function normalizeRadius(raw, fallback = DEFAULT_RADIUS_METERS) {
  const n = parseCoord(raw);
  if (n == null) return fallback;
  return Math.round(n);
}

export function normalizeEmailDomain(raw) {
  let v = String(raw ?? "").trim().toLowerCase();
  if (!v) return "";
  if (!v.startsWith("@")) v = `@${v}`;
  return v;
}

export function normalizeCompanyRecord(raw) {
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

export function deriveVerificationMode(geofenceVerificationRequired) {
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

export function checkCompanyRecordGate(input) {
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

export function checkGeofenceConfigGate(input) {
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

export function checkLocationAgainstGeofence(input) {
  const mode = deriveVerificationMode(input.geofenceVerificationRequired !== false);
  if (!mode.geofenceVerificationRequired) {
    return {
      ok: true,
      verdict: "self_declaration",
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
        verdict: "unchecked",
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
      verdict: "outside",
      distanceMeters: dist,
      radiusMeters: radius,
      discardedCoords: true,
    };
  }

  return {
    ok: true,
    verdict: "inside",
    verificationMode: mode.verificationMode,
    checkInIsProof: true,
    distanceMeters: dist,
    radiusMeters: radius,
    discardedCoords: true,
  };
}

export function enrichGeofenceRow(station, opts) {
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
    coordsLabel: configured ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : "",
    radiusLabelAr: `${radius} متر`,
    radiusLabelEn: `${radius} m`,
    configured,
    crew: opts?.crew ?? (station.crew != null ? Number(station.crew) : null),
  };
}

export function deriveCompanyRows(record, lang = "ar") {
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

export function exposeAnonymousRateLimits(limits) {
  const day = Math.max(1, Number(limits?.day ?? DEFAULT_RATE_LIMITS.day) || DEFAULT_RATE_LIMITS.day);
  const week = Math.max(1, Number(limits?.week ?? DEFAULT_RATE_LIMITS.week) || DEFAULT_RATE_LIMITS.week);
  const month = Math.max(1, Number(limits?.month ?? DEFAULT_RATE_LIMITS.month) || DEFAULT_RATE_LIMITS.month);
  return [
    { key: "day", labelAr: "بلاغات في اليوم", labelEn: "Reports per day", value: day },
    { key: "week", labelAr: "بلاغات في الأسبوع", labelEn: "Reports per week", value: week },
    { key: "month", labelAr: "بلاغات في الشهر", labelEn: "Reports per month", value: month },
  ];
}
