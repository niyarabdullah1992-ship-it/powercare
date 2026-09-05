/** Shared field-attendance gates — tasks, work proof, and UI status. */

export type AttendanceRowLike = {
  status?: string | null;
  check_in_at?: string | null;
  in_zone?: boolean | null;
  location_status?: string | null;
};

export type FieldGateAuth = {
  userId?: string | null;
  admin?: boolean;
  owner?: boolean;
};

export type FieldGateOptions = {
  /** Remote tasks/proofs skip the punch gate. */
  mode?: string | null;
  /** When true, absent Supabase attendance service blocks (server handlers). */
  requireAttendanceService?: boolean;
  /** Company plan slug — individual plan skips gate (legacy). */
  plan?: string | null;
  /** When GPS is required for the tenant, check-in must be in-zone. */
  gpsRequired?: boolean;
};

export function riyadhDateKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function isCheckedInToday(attendance: AttendanceRowLike | null | undefined) {
  return !!attendance && ["present", "late"].includes(String(attendance.status || ""));
}

export function isGeoVerifiedCheckIn(attendance: AttendanceRowLike | null | undefined) {
  if (!isCheckedInToday(attendance)) return false;
  const loc = String(attendance?.location_status || "").toLowerCase();
  if (loc === "outside" || loc === "inconclusive") return false;
  if (attendance?.in_zone === false) return false;
  return true;
}

/** Named gate for on-site task logging and field work proof — never silent. */
export function checkFieldAttendanceGate(
  attendance: AttendanceRowLike | null | undefined,
  auth: FieldGateAuth,
  opts: FieldGateOptions = {},
) {
  if (opts.mode === "remote") return { ok: true as const, skipped: "remote" as const };

  if (auth.admin || auth.owner) {
    return { ok: true as const, skipped: "admin_or_owner" as const };
  }

  if (String(opts.plan || "").toLowerCase() === "individual") {
    return { ok: true as const, skipped: "individual" as const };
  }

  if (opts.requireAttendanceService) {
    return {
      ok: false as const,
      error: "CHECK_IN_REQUIRED",
      reason: "لا يمكن تسجيل إنجاز حضوري دون خدمة الحضور — تحقق من إعدادات الخادم.",
      reasonEn: "On-site actions require the attendance service — check server configuration.",
    };
  }

  if (!isCheckedInToday(attendance)) {
    return {
      ok: false as const,
      error: "CHECK_IN_REQUIRED",
      reason: "تسجيل الإنجاز الميداني موقوف حتى بصمة اليوم — سجّل حضورك أولًا.",
      reasonEn: "On-site actions are blocked until today's check-in.",
      attendance: attendance || null,
    };
  }

  if (opts.gpsRequired && !isGeoVerifiedCheckIn(attendance)) {
    return {
      ok: false as const,
      error: "GEO_CHECK_IN_REQUIRED",
      reason: "الإثبات الميداني يتطلب بصمة داخل نطاق الفرع — سجّل حضورك من موقع العمل.",
      reasonEn: "Field proof requires a geo-verified check-in within the station boundary.",
      attendance: attendance || null,
    };
  }

  return { ok: true as const, attendance: attendance || null };
}
