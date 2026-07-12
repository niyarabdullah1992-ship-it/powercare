import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { getTodaysShift } from "@/lib/attendance";
import { LogIn, LogOut, MapPin, Loader2, CheckCircle2, Navigation } from "lucide-react";

function distanceMeters(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

// Smart one-tap attendance hero: pre-locates the employee on load, shows live
// in/out-of-range status against their station, then checks in with a single tap.
export default function QuickCheckInCard({ currentUser, company }) {
  const { t } = useI18n();
  const { data } = useAuth();
  const shift = getTodaysShift(data, currentUser);
  const station = data?.stations?.find((s) => s.id === currentUser.stationId);
  const [settings, setSettings] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [coords, setCoords] = useState(null);
  const [locState, setLocState] = useState("idle"); // idle | locating | ready | denied
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [setRes, attRes] = await Promise.all([
          base44.functions.invoke("supabaseAttendance", { action: "getSettings", companyId: company.id }),
          base44.functions.invoke("supabaseAttendance", { action: "getTodayStatus", employeeId: currentUser.id }),
        ]);
        setSettings(setRes?.data?.settings || null);
        setAttendance(attRes?.data?.attendance || null);
        if (setRes?.data?.settings?.gps_enabled) locate();
      } catch { /* best-effort */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, company?.id]);

  const locate = () => {
    if (!navigator.geolocation) { setLocState("denied"); return; }
    setLocState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocState("ready"); },
      () => setLocState("denied"),
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const stationCoords = station?.lat != null && station?.lng != null ? { lat: station.lat, lng: station.lng } : null;
  const dist = coords && stationCoords ? distanceMeters(coords, stationCoords) : null;
  const inRange = dist != null && station?.radiusMeters != null ? dist <= station.radiusMeters : null;

  const handleCheckIn = async () => {
    setError("");
    setLoading(true);
    try {
      let c = coords;
      if (settings?.gps_enabled && !c) {
        c = await new Promise((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 8000 }
          );
        });
        if (c) { setCoords(c); setLocState("ready"); }
        if (settings.gps_required && !c) {
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
        lat: c?.lat, lng: c?.lng,
        shiftStart: shift?.start,
        stationLat: station?.lat ?? null,
        stationLng: station?.lng ?? null,
        radiusMeters: station?.radiusMeters ?? null,
      });
      if (res?.data?.attendance) setAttendance(res.data.attendance);
    } catch (err) {
      const code = err?.response?.data?.error;
      setError(code === "GPS_REQUIRED" ? t("locationDenied") : (code || t("aiActionFailed")));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("supabaseAttendance", { action: "checkOut", employeeId: currentUser.id, shiftEnd: shift?.end });
      if (res?.data?.attendance) setAttendance(res.data.attendance);
    } catch { /* best-effort */ } finally {
      setLoading(false);
    }
  };

  const checkedIn = !!attendance?.check_in_at;
  const checkedOut = !!attendance?.check_out_at;

  return (
    <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-card p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        {/* Big one-tap button */}
        <div className="flex justify-center md:justify-start">
          {checkedOut ? (
            <div className="w-28 h-28 rounded-full border-4 border-emerald-300 bg-emerald-50 flex flex-col items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-8 h-8 mb-1" />
              <span className="text-[11px] font-body text-center px-2">{t("alreadyCheckedOut")}</span>
            </div>
          ) : (
            <button
              onClick={checkedIn ? handleCheckOut : handleCheckIn}
              disabled={loading}
              className={`w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1 text-sm font-body font-medium shadow-lg transition-transform active:scale-95 disabled:opacity-60 ${
                checkedIn
                  ? "bg-card border-4 border-accent text-accent hover:bg-accent/5"
                  : "bg-accent text-accent-foreground hover:brightness-105 border-4 border-accent/40"
              }`}
            >
              {loading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : checkedIn ? (
                <><LogOut className="w-7 h-7" />{t("checkOut")}</>
              ) : (
                <><LogIn className="w-7 h-7" />{t("checkIn")}</>
              )}
            </button>
          )}
        </div>

        {/* Status + smart location */}
        <div className="flex-1 space-y-2 text-center md:text-start">
          <h3 className="font-heading text-xl font-semibold">{t("myAttendance")}</h3>

          {checkedIn && (
            <p className="text-xs text-muted-foreground font-body">
              {t("checkedInAt")} {new Date(attendance.check_in_at).toLocaleTimeString()}
              {attendance.status === "late" && Number(attendance.late_minutes) > 0 && (
                <span className="text-amber-700"> · {t("lateBy")} {attendance.late_minutes} {t("minutesUnit")}</span>
              )}
            </p>
          )}
          {checkedOut && (
            <p className="text-xs text-muted-foreground font-body">{t("checkedOutAt")} {new Date(attendance.check_out_at).toLocaleTimeString()}</p>
          )}

          {/* Live GPS indicator */}
          {settings?.gps_enabled && !checkedOut && (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              {locState === "locating" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-body text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("locating")}
                </span>
              )}
              {locState === "ready" && inRange === true && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-body text-emerald-700">
                  <MapPin className="w-3.5 h-3.5" /> {t("insideLocation")} ({dist}m)
                </span>
              )}
              {locState === "ready" && inRange === false && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 border border-red-300 text-xs font-body text-red-700">
                  <MapPin className="w-3.5 h-3.5" /> {t("outsideLocation")} ({dist}m)
                </span>
              )}
              {locState === "ready" && inRange === null && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-body text-emerald-700">
                  <MapPin className="w-3.5 h-3.5" /> {t("locationReady")}
                </span>
              )}
              {(locState === "denied" || locState === "idle") && (
                <button
                  onClick={locate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-accent/40 bg-accent/10 text-xs font-body text-accent hover:bg-accent/20"
                >
                  <Navigation className="w-3.5 h-3.5" /> {t("enableLocation")}
                </button>
              )}
              {station?.name && (
                <span className="text-[11px] text-muted-foreground font-body">{station.name}</span>
              )}
            </div>
          )}

          {error && <p className="text-xs text-destructive font-body">{error}</p>}
        </div>
      </div>
    </div>
  );
}