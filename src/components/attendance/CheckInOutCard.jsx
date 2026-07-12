import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { getTodaysShift } from "@/lib/attendance";
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
  const shift = getTodaysShift(data, currentUser);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, company?.id]);

  const getLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 8000 }
      );
    });

  const handleCheckIn = async () => {
    setError("");
    setLoading(true);
    try {
      let coords = null;
      if (settings?.gps_enabled) {
        coords = await getLocation();
        if (settings.gps_required && !coords) {
          setError(t("locationDenied"));
          setLoading(false);
          return;
        }
      }
      const res = await base44.functions.invoke("supabaseAttendance", {
        action: "checkIn",
        companyId: company.id,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        stationId: currentUser.stationId || null,
        lat: coords?.lat, lng: coords?.lng,
        shiftStart: shift?.start,
      });
      const att = res?.data?.attendance;
      if (att) { setAttendance(att); onStatusChange?.(att); }
    } catch (err) {
      setError(err?.response?.data?.error === "GPS_REQUIRED" ? t("locationDenied") : "Failed to check in");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("supabaseAttendance", { action: "checkOut", employeeId: currentUser.id, shiftEnd: shift?.end });
      const att = res?.data?.attendance;
      if (att) { setAttendance(att); onStatusChange?.(att); }
    } catch {
      // best-effort
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
          {t("checkedInAt")} {new Date(attendance.check_in_at).toLocaleTimeString()}
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
          {t("checkedOutAt")} {new Date(attendance.check_out_at).toLocaleTimeString()}
        </p>
      )}
      {attendance?.early_checkout && (
        <p className="text-xs text-amber-700 font-body">{t("earlyCheckoutLabel")}</p>
      )}
      {error && <p className="text-xs text-destructive font-body">{error}</p>}

      <div className="flex gap-2">
        {!attendance?.check_in_at ? (
          <button
            onClick={handleCheckIn}
            disabled={loading}
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

      {settings?.gps_enabled && (
        <p className="text-[11px] text-muted-foreground font-body flex items-center gap-1"><MapPin className="w-3 h-3" /> {t("gpsNote")}</p>
      )}
    </div>
  );
}