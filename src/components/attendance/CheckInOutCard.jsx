import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { getTodaysShift } from "@/lib/attendance";
import { getAccuratePosition, startGeoWarmup } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import { formatTime, useTimeFormat } from "@/hooks/useTimeFormat";
import { HQ_STATION_ID } from "@/lib/store";
import { LogIn, LogOut, MapPin, Loader2, Clock } from "lucide-react";

const STATUS_STYLE = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-300",
  late: "bg-amber-100 text-amber-700 border-amber-300",
  absent: "bg-red-100 text-red-700 border-red-300",
};

// Employee-facing daily check-in/check-out widget — also the source of truth MyTasks
// reads from to gate task actions until attendance has been logged for today.
export default function CheckInOutCard({ currentUser, company, t, onStatusChange }) {
  const { data } = useAuth();
  const { lang } = useI18n();
  const { format } = useTimeFormat();
  const shift = getTodaysShift(data, currentUser);
  const assignedStationIds = [currentUser?.stationId || HQ_STATION_ID, ...(currentUser?.managedStations || [])].filter(Boolean);
  const hasAssignedStation = assignedStationIds.some((id) => data?.stations?.some((station) => station.id === id));
  const station = data?.stations?.find((s) => s.id === (shift?.stationId || currentUser.stationId || HQ_STATION_ID));
  const [settings, setSettings] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [setRes, attRes] = await Promise.all([
        base44.functions.invoke("supabaseAttendance", { action: "getSettings", companyId: company.id }),
        base44.functions.invoke("supabaseAttendance", { action: "getTodayStatus", employeeId: currentUser.id }),
      ]);
      setSettings(setRes?.data?.settings || null);
      const att = attRes?.data?.attendance || null;
      setAttendance(att);
      onStatusChange?.(att);
    } catch {
      // best-effort
    }
  };

  useEffect(() => {
    load();
    // Never request GPS until the employee has at least one assigned workplace.
    if (hasAssignedStation) startGeoWarmup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, company?.id]);

  const handleCheckIn = async () => {
    setError("");
    if (!shift) {
      setError(lang === "ar" ? "لا يمكنك تسجيل الحضور لأنك غير مدرج في جدول اليوم." : "You cannot check in because you are not scheduled today.");
      return;
    }
    if (!hasAssignedStation) {
      setError(lang === "ar" ? "لا يمكنك تسجيل الحضور قبل تعيين محطة عمل لك. تواصل مع إدارة الشركة." : "You cannot check in until a workplace is assigned to you. Contact company management.");
      return;
    }
    setLoading(true);
    try {
      // Location is MANDATORY before check-in — no location, no check-in.
      const coords = await getAccuratePosition();
      if (!coords) {
        setError(t("locationDenied"));
        setLoading(false);
        return;
      }
      const res = await base44.functions.invoke("supabaseAttendance", {
        action: "checkIn",
        companyId: company.id,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        stationId: currentUser.stationId || HQ_STATION_ID,
        lat: coords?.lat, lng: coords?.lng,
        accuracy: coords?.accuracy ?? null,
        shiftStart: shift?.start,
        stationLat: station?.lat ?? null,
        stationLng: station?.lng ?? null,
        radiusMeters: station?.radiusMeters ?? null,
      });
      const att = res?.data?.attendance;
      if (att) { setAttendance(att); onStatusChange?.(att); window.dispatchEvent(new CustomEvent("attendance-updated", { detail: att })); }
    } catch (err) {
      const code = err?.response?.data?.error;
      setError(code === "NOT_SCHEDULED" ? (lang === "ar" ? "لا يمكنك تسجيل الحضور لأنك غير مدرج في جدول اليوم." : "You cannot check in because you are not scheduled today.") : code === "GPS_REQUIRED" ? t("locationDenied") : code === "STATION_LOCATION_REQUIRED" ? t("locationNotSet") : code === "OUTSIDE_STATION" ? t("outsideLocation") : (code || "Failed to check in"));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setError("");
    setLoading(true);
    try {
      // Location is also MANDATORY at check-out — same rule as check-in.
      const coords = await getAccuratePosition();
      if (!coords) {
        setError(t("locationDenied"));
        setLoading(false);
        return;
      }
      const res = await base44.functions.invoke("supabaseAttendance", {
        action: "checkOut",
        companyId: company.id,
        employeeId: currentUser.id,
        shiftEnd: shift?.end,
        lat: coords.lat, lng: coords.lng,
        accuracy: coords.accuracy ?? null,
        stationLat: station?.lat ?? null,
        stationLng: station?.lng ?? null,
        radiusMeters: station?.radiusMeters ?? null,
      });
      const att = res?.data?.attendance;
      if (att) { setAttendance(att); onStatusChange?.(att); window.dispatchEvent(new CustomEvent("attendance-updated", { detail: att })); }
    } catch (err) {
      const code = err?.response?.data?.error;
      setError(code === "GPS_REQUIRED" ? t("locationDenied") : code === "STATION_LOCATION_REQUIRED" ? t("locationNotSet") : code === "OUTSIDE_STATION" ? t("outsideLocation") : (code || "Failed to check out"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" /> {t("myAttendance")}
        </h3>
        {attendance?.status && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-body border ${STATUS_STYLE[attendance.status] || "bg-muted"}`}>
            {t(`attendanceStatus${attendance.status.charAt(0).toUpperCase()}${attendance.status.slice(1)}`)}
          </span>
        )}
      </div>

      {attendance?.check_in_at && (
        <p className="text-xs text-muted-foreground font-body">
          {t("checkedInAt")} {formatTime(attendance.check_in_at, format, lang)}
        </p>
      )}
      {attendance?.station_id && attendance.station_id !== currentUser.stationId && (
        <p className="text-xs text-accent font-body flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {lang === "ar" ? "تم توثيق الحضور في:" : "Attendance recorded at:"}{" "}
          {data?.stations?.find((s) => s.id === attendance.station_id)?.name || (lang === "ar" ? "موقع آخر" : "another location")}
        </p>
      )}
      {attendance?.status === "late" && Number(attendance.late_minutes) > 0 && (
        <p className="text-xs text-amber-700 font-body">{t("lateBy")} {attendance.late_minutes} {t("minutesUnit")}</p>
      )}
      {attendance?.excused && (
        <p className="text-xs text-emerald-700 font-body">{t("excused")}</p>
      )}
      {attendance?.check_out_at && (
        <p className="text-xs text-muted-foreground font-body">
          {t("checkedOutAt")} {formatTime(attendance.check_out_at, format, lang)}
        </p>
      )}
      {attendance?.early_checkout && (
        <p className="text-xs text-amber-700 font-body">{t("earlyCheckoutLabel")}</p>
      )}
      {attendance?.location_status && (
        <p className={`text-xs font-body ${attendance.location_status === "inside" ? "text-emerald-700" : "text-red-700"}`}>
          {attendance.location_status === "inside" ? t("insideLocation") : t("outsideLocation")}
          {attendance.distance_meters != null && ` (${attendance.distance_meters}m)`}
        </p>
      )}
      {!shift ? (
        <p className="text-xs text-amber-700 font-body">
          {lang === "ar" ? "أنت غير مدرج في جدول اليوم؛ تسجيل الحضور غير متاح." : "You are not scheduled today; check-in is unavailable."}
        </p>
      ) : !hasAssignedStation && (
        <p className="text-xs text-amber-700 font-body">
          {lang === "ar" ? "لم تُعيَّن لك محطة عمل بعد؛ تسجيل الحضور غير متاح." : "No workplace is assigned yet; check-in is unavailable."}
        </p>
      )}
      {error && <p className="text-xs text-destructive font-body whitespace-pre-wrap break-words">{error}</p>}

      <div className="flex gap-2">
        {!attendance?.check_in_at ? (
          <button
            onClick={handleCheckIn}
            disabled={loading || !shift}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} {t("checkIn")}
          </button>
        ) : !attendance?.check_out_at ? (
          <button
            onClick={handleCheckOut}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-sm font-body disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} {t("checkOut")}
          </button>
        ) : (
          <p className="text-sm text-muted-foreground font-body">{t("alreadyCheckedOut")}</p>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground font-body flex items-center gap-1"><MapPin className="w-3 h-3" /> {t("gpsNote")}</p>
    </div>
  );
}