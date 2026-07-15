import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getTodaysShift } from "@/lib/attendance";
import { getAccuratePosition, startGeoWarmup } from "@/lib/geo";
import { LogIn, LogOut, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// One-tap check-in / check-out straight from the dashboard (same GPS rules as
// the Attendance page widget).
export default function QuickAttendanceButton({ currentUser, company, data, t }) {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const shift = getTodaysShift(data, currentUser);
  const station = data?.stations?.find((s) => s.id === currentUser.stationId);

  useEffect(() => {
    base44.functions.invoke("supabaseAttendance", { action: "getTodayStatus", employeeId: currentUser.id })
      .then((res) => setAttendance(res?.data?.attendance || null))
      .catch(() => {});
    startGeoWarmup();
  }, [currentUser.id]);

  const act = async (kind) => {
    setLoading(true);
    try {
      const coords = await getAccuratePosition();
      if (!coords) {
        toast({ description: t("locationDenied"), variant: "destructive" });
        return;
      }
      const payload = kind === "checkIn"
        ? { action: "checkIn", companyId: company.id, employeeId: currentUser.id, employeeName: currentUser.name, stationId: currentUser.stationId || null, lat: coords.lat, lng: coords.lng, accuracy: coords.accuracy ?? null, shiftStart: shift?.start, stationLat: station?.lat ?? null, stationLng: station?.lng ?? null, radiusMeters: station?.radiusMeters ?? null }
        : { action: "checkOut", employeeId: currentUser.id, shiftEnd: shift?.end, lat: coords.lat, lng: coords.lng, accuracy: coords.accuracy ?? null, stationLat: station?.lat ?? null, stationLng: station?.lng ?? null, radiusMeters: station?.radiusMeters ?? null };
      const res = await base44.functions.invoke("supabaseAttendance", payload);
      if (res?.data?.attendance) setAttendance(res.data.attendance);
    } catch (err) {
      const code = err?.response?.data?.error;
      toast({
        description: code === "GPS_REQUIRED" ? t("locationDenied") : code === "OUTSIDE_STATION" ? t("outsideLocation") : code === "STATION_LOCATION_REQUIRED" ? t("locationNotSet") : (code || "Failed"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (attendance?.check_in_at && attendance?.check_out_at) {
    return (
      <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-body">
        <CheckCircle2 className="w-3.5 h-3.5" /> {t("alreadyCheckedOut")}
      </span>
    );
  }
  const checkedIn = !!attendance?.check_in_at;
  return (
    <button
      onClick={() => act(checkedIn ? "checkOut" : "checkIn")}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-body font-semibold transition disabled:opacity-50 ${checkedIn ? "border border-border hover:bg-muted" : "bg-accent text-accent-foreground hover:opacity-90"}`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : checkedIn ? <LogOut className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
      {checkedIn ? t("checkOut") : t("checkIn")}
    </button>
  );
}