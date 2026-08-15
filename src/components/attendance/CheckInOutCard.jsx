
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { getTodaysShift, isAttendancePolicyError, isLocationRequired } from "@/lib/attendance";
import { getAccuratePosition, startGeoWarmup } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import { formatTime, useTimeFormat } from "@/hooks/useTimeFormat";
import { LogIn, LogOut, MapPin, Loader2, ShieldCheck, CalendarClock } from "lucide-react";
import { isLocalPreviewActive } from "@/lib/localPreview";
import {
  getLocalTodayAttendance,
  localAttendanceSettings,
  localCheckIn,
  localCheckOut,
} from "@/lib/localAttendanceFallback";
import { ACCENT, BORDER, CARD, MUTED, NAVY, SURFACE, ui } from "@/lib/platformStyles";

const STATUS_PILL = {
  present: { bg: "#ECFDF3", fg: "#15803D", bd: "#BBF7D0", ar: "حاضر", en: "Present" },
  late: { bg: "#FFFBEB", fg: "#B45309", bd: "#FDE68A", ar: "متأخر", en: "Late" },
  absent: { bg: "#FEF2F2", fg: "#DC2626", bd: "#FECACA", ar: "غائب", en: "Absent" },
};

function elapsedLabel(checkInAt, lang) {
  if (!checkInAt) return "";
  const ms = Date.now() - new Date(checkInAt).getTime();
  if (ms < 0) return "";
  const ar = lang === "ar";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h === 0) return ar ? `${m} دقيقة منذ الدخول` : `${m}m since check-in`;
  return ar ? `${h} س ${m} د منذ الدخول` : `${h}h ${m}m since check-in`;
}

/**
 * Employee daily check-in/out — primary punch surface on the attendance hub.
 */
export default function CheckInOutCard({ currentUser, company, t, onStatusChange, compact = false }) {
  const { data, refresh } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { format } = useTimeFormat();
  const local = isLocalPreviewActive();
  const shift = getTodaysShift(data, currentUser);
  const defaultStationId = data?.stations?.[0]?.id || null;
  const scheduledStationId = shift?.stationId || currentUser?.stationId || defaultStationId;
  const assignedStationIds = [scheduledStationId, ...(currentUser?.managedStations || [])].filter(Boolean);
  const hasAssignedStation = assignedStationIds.some((id) => data?.stations?.some((station) => station.id === id));
  const station = data?.stations?.find((s) => s.id === scheduledStationId);
  const [settings, setSettings] = useState(local ? localAttendanceSettings() : null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localMode, setLocalMode] = useState(local);
  const [tick, setTick] = useState(Date.now());

  const load = async () => {
    if (local || !company?.id) {
      const att = company?.id ? getLocalTodayAttendance(company.id, currentUser.id) : null;
      setSettings(localAttendanceSettings());
      setAttendance(att);
      setLocalMode(true);
      onStatusChange?.(att);
      return;
    }
    try {
      const [setRes, attRes] = await Promise.all([
        base44.functions.invoke("supabaseAttendance", { action: "getSettings", companyId: company.id }),
        base44.functions.invoke("supabaseAttendance", { action: "getTodayStatus", employeeId: currentUser.id }),
      ]);
      const loadedSettings = setRes?.data?.settings || null;
      setSettings(loadedSettings);
      if (isLocationRequired(loadedSettings) && hasAssignedStation) startGeoWarmup();
      setLocalMode(false);
      const att = attRes?.data?.attendance || null;
      setAttendance(att);
      onStatusChange?.(att);
    } catch {
      const att = getLocalTodayAttendance(company.id, currentUser.id);
      setSettings(localAttendanceSettings());
      setAttendance(att);
      setLocalMode(true);
      onStatusChange?.(att);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, company?.id]);

  useEffect(() => {
    if (!attendance?.check_in_at || attendance?.check_out_at) return undefined;
    const id = window.setInterval(() => setTick(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, [attendance?.check_in_at, attendance?.check_out_at]);

  const scheduleBlocks = !shift && settings?.schedule_required !== false;
  const statusPill = attendance?.status ? STATUS_PILL[attendance.status] : null;
  const stationName = station?.name || (ar ? "الفرع الافتراضي" : "Default station");
  const elapsed = useMemo(
    () => elapsedLabel(attendance?.check_in_at, lang),
    [attendance?.check_in_at, lang, tick],
  );

  const punch = async (action) => {
    if (action === "in") {
      if (scheduleBlocks) {
        setError(ar ? "لا يمكنك تسجيل الحضور لأنك غير مدرج في جدول اليوم." : "You cannot check in because you are not scheduled today.");
        return;
      }
      if (!hasAssignedStation && !localMode) {
        setError(ar ? "لا يمكنك تسجيل الحضور قبل تعيين فرع عمل لك." : "You cannot check in until a workplace is assigned.");
        return;
      }
    }
    setError("");
    setLoading(true);
    try {
      if (localMode || isLocalPreviewActive()) {
        const att = action === "in"
          ? localCheckIn(company.id, {
              employeeId: currentUser.id,
              employeeName: currentUser.name,
              stationId: scheduledStationId || defaultStationId,
            })
          : localCheckOut(company.id, { employeeId: currentUser.id });
        setAttendance(att);
        onStatusChange?.(att);
        window.dispatchEvent(new CustomEvent("attendance-updated", { detail: att }));
        await refresh?.();
        return;
      }
      const settingsRes = await base44.functions.invoke("supabaseAttendance", { action: "getSettings", companyId: company.id });
      const currentSettings = settingsRes?.data?.settings || settings;
      setSettings(currentSettings);
      let coords = null;
      if (isLocationRequired(currentSettings)) {
        coords = await getAccuratePosition();
        if (!coords) {
          setError(t("locationDenied"));
          return;
        }
      }
      const res = await base44.functions.invoke("supabaseAttendance", {
        action: action === "in" ? "checkIn" : "checkOut",
        companyId: company.id,
        employeeId: currentUser.id,
        ...(coords ? { lat: coords.lat, lng: coords.lng, accuracy: coords.accuracy } : {}),
        ...(action === "in"
          ? {
              employeeName: currentUser.name,
              stationId: scheduledStationId,
              shiftStart: shift?.start,
            }
          : {
              shiftEnd: shift?.end,
            }),
      });
      const att = res?.data?.attendance;
      if (att) {
        setAttendance(att);
        onStatusChange?.(att);
        window.dispatchEvent(new CustomEvent("attendance-updated", { detail: att }));
      }
    } catch (err) {
      const code = err?.response?.data?.error;
      if (company?.id && !isAttendancePolicyError(code)) {
        try {
          const att = action === "in"
            ? localCheckIn(company.id, {
                employeeId: currentUser.id,
                employeeName: currentUser.name,
                stationId: scheduledStationId || defaultStationId,
              })
            : localCheckOut(company.id, { employeeId: currentUser.id });
          setSettings(localAttendanceSettings());
          setLocalMode(true);
          setAttendance(att);
          onStatusChange?.(att);
          window.dispatchEvent(new CustomEvent("attendance-updated", { detail: att }));
          await refresh?.();
          return;
        } catch {
          /* fall through */
        }
      }
      setError(
        code === "NOT_SCHEDULED"
          ? (ar ? "لا يمكنك تسجيل الحضور لأنك غير مدرج في جدول اليوم." : "You cannot check in because you are not scheduled today.")
          : code === "GPS_REQUIRED"
            ? t("locationDenied")
            : code === "STATION_LOCATION_REQUIRED"
              ? t("locationNotSet")
              : code === "OUTSIDE_STATION"
                ? t("outsideLocation")
                : (code || (ar ? (action === "in" ? "فشل تسجيل الحضور" : "فشل تسجيل الانصراف") : (action === "in" ? "Failed to check in" : "Failed to check out")))
      );
    } finally {
      setLoading(false);
    }
  };

  const phase = !attendance?.check_in_at
    ? "awaiting_in"
    : !attendance?.check_out_at
      ? "awaiting_out"
      : "done";

  const accentColor = phase === "awaiting_out" ? ACCENT : phase === "done" ? "#15803D" : "#94A3B8";

  const punchButton = (action, label) => (
    <button
      type="button"
      onClick={() => punch(action)}
      disabled={loading || (action === "in" && scheduleBlocks && !localMode)}
      style={{
        ...ui.btnPrimary,
        height: compact ? 34 : 40,
        padding: compact ? "0 14px" : "0 18px",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        opacity: loading || (action === "in" && scheduleBlocks && !localMode) ? 0.45 : 1,
        cursor: loading || (action === "in" && scheduleBlocks && !localMode) ? "not-allowed" : "pointer",
      }}
    >
      {loading
        ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} />
        : action === "in"
          ? <LogIn style={{ width: 15, height: 15 }} strokeWidth={1.75} />
          : <LogOut style={{ width: 15, height: 15 }} strokeWidth={1.75} />}
      {label}
    </button>
  );

  if (compact) {
    return (
      <section
        style={{
          borderRadius: 16,
          border: `1px solid ${BORDER}`,
          background: CARD,
          overflow: "hidden",
        }}
        dir={ar ? "rtl" : "ltr"}
        data-testid="check-in-out-card"
      >
        <div style={{ height: 3, background: accentColor }} />
        <div style={{ padding: "10px 14px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
          <div style={{ flex: "1 1 180px", minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: NAVY }}>
              {phase === "awaiting_in"
                ? (ar ? "ضع حضر عندما تصل" : "Mark present when you arrive")
                : phase === "awaiting_out"
                  ? (ar ? "ورديتك مفتوحة" : "Shift is open")
                  : (ar ? "اكتملت ورديتك" : "Shift complete")}
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: MUTED }}>
              {ar ? "حضور" : "In"} {attendance?.check_in_at ? formatTime(attendance.check_in_at, format, lang) : "—"}
              {" · "}
              {ar ? "انصراف" : "Out"} {attendance?.check_out_at ? formatTime(attendance.check_out_at, format, lang) : "—"}
              {elapsed ? ` · ${elapsed}` : ""}
            </p>
          </div>
          {statusPill && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
              background: statusPill.bg, color: statusPill.fg, border: `1px solid ${statusPill.bd}`,
            }}
            >
              {ar ? statusPill.ar : statusPill.en}
            </span>
          )}
          {error && <p style={{ margin: 0, fontSize: 11, color: "#DC2626", flex: "1 1 100%" }}>{error}</p>}
          {phase === "awaiting_in" && punchButton("in", ar ? "حضر" : "Present")}
          {phase === "awaiting_out" && punchButton("out", ar ? "انصرف" : "Out")}
        </div>
      </section>
    );
  }

  return (
    <section
      style={{
        borderRadius: 16,
        border: `1px solid ${BORDER}`,
        background: CARD,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
      dir={ar ? "rtl" : "ltr"}
      data-testid="check-in-out-card"
    >
      <div style={{ height: 4, background: accentColor }} />
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: 0.04, color: MUTED, textTransform: "uppercase" }}>
              {ar ? "بطاقة الحضور والانصراف" : "Check-in / check-out"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600, color: NAVY }}>
              {phase === "awaiting_in"
                ? (ar ? "ضع حضر عندما تصل" : "Mark present when you arrive")
                : phase === "awaiting_out"
                  ? (ar ? "ورديتك مفتوحة — ضع انصرف عند المغادرة" : "Shift is open — mark out when you leave")
                  : (ar ? "اكتملت ورديتك" : "Shift complete")}
            </p>
            {elapsed ? (
              <p style={{ margin: "4px 0 0", fontSize: 11, fontWeight: 600, color: ACCENT }}>{elapsed}</p>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {localMode && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                background: "#ECFDF3", color: "#15803D", border: "1px solid #BBF7D0",
              }}
              >
                {ar ? "محلي" : "Local"}
              </span>
            )}
            {statusPill && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
                background: statusPill.bg, color: statusPill.fg, border: `1px solid ${statusPill.bd}`,
              }}
              >
                {ar ? statusPill.ar : statusPill.en}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <div style={{ padding: "11px 12px", borderRadius: 11, border: "1px solid #E2E8F0", background: SURFACE }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 600, color: MUTED }}>{ar ? "الحضور" : "Check-in"}</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: attendance?.check_in_at ? NAVY : MUTED, fontFamily: "'IBM Plex Sans',sans-serif" }}>
              {attendance?.check_in_at ? formatTime(attendance.check_in_at, format, lang) : "—"}
            </p>
          </div>
          <div style={{ padding: "11px 12px", borderRadius: 11, border: "1px solid #E2E8F0", background: SURFACE }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 600, color: MUTED }}>{ar ? "الانصراف" : "Check-out"}</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: attendance?.check_out_at ? NAVY : MUTED, fontFamily: "'IBM Plex Sans',sans-serif" }}>
              {attendance?.check_out_at ? formatTime(attendance.check_out_at, format, lang) : "—"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11, color: MUTED, lineHeight: 1.55 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <MapPin style={{ width: 12, height: 12, color: ACCENT }} strokeWidth={1.75} />
            {stationName}
          </span>
          {shift ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <CalendarClock style={{ width: 12, height: 12, color: ACCENT }} strokeWidth={1.75} />
              {shift.start || "—"}–{shift.end || "—"}
            </span>
          ) : (
            <Link to="/app/shifts" style={{ color: ACCENT, textDecoration: "none", fontWeight: 600 }}>
              {ar ? "لا وردية اليوم — راجع الجدول" : "No shift today — check schedule"}
            </Link>
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <ShieldCheck style={{ width: 12, height: 12, color: ACCENT }} strokeWidth={1.75} />
            {isLocationRequired(settings)
              ? (ar ? "شرط الموقع: يجب أن تكون داخل الفرع" : "Location required — must be at the station")
              : (ar ? "تسجيل يدوي — حضر / انصرف" : "Manual — present / out")}
          </span>
        </div>

        {error && <p style={{ margin: 0, fontSize: 11, color: "#DC2626" }}>{error}</p>}
        {scheduleBlocks && !localMode && (
          <p style={{ margin: 0, fontSize: 11, color: "#B45309" }}>
            {ar ? "غير مدرج في جدول اليوم — البصمة موقوفة." : "Not scheduled today — punch is blocked."}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {phase === "awaiting_in" && (
            <button
              type="button"
              onClick={() => punch("in")}
              disabled={loading || (scheduleBlocks && !localMode)}
              style={{
                ...ui.btnPrimary,
                height: 40,
                padding: "0 18px",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                opacity: loading || (scheduleBlocks && !localMode) ? 0.45 : 1,
                cursor: loading || (scheduleBlocks && !localMode) ? "not-allowed" : "pointer",
              }}
            >
              {loading ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <LogIn style={{ width: 15, height: 15 }} strokeWidth={1.75} />}
              {ar ? "حضر" : "Present"}
            </button>
          )}
          {phase === "awaiting_out" && (
            <button
              type="button"
              onClick={() => punch("out")}
              disabled={loading}
              style={{
                ...ui.btnPrimary,
                height: 40,
                padding: "0 18px",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                opacity: loading ? 0.45 : 1,
              }}
            >
              {loading ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <LogOut style={{ width: 15, height: 15 }} strokeWidth={1.75} />}
              {ar ? "انصرف" : "Out"}
            </button>
          )}
          {phase === "done" && (
            <span style={{ fontSize: 12, color: MUTED, padding: "10px 0" }}>{t("alreadyCheckedOut")}</span>
          )}
          {phase !== "awaiting_in" && (
            <Link
              to="/app/tasks"
              style={{
                ...ui.btnGhost,
                height: 40,
                padding: "0 14px",
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              {ar ? "مهامي" : "My tasks"}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
