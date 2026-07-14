import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany } from "@/lib/store";
import { ClipboardCheck, LogIn, LogOut, Timer, MapPin, Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import AttendanceInsights from "@/components/individual/AttendanceInsights";
import ExportButtons from "@/components/individual/ExportButtons";

const uid = () => `patt_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function IndividualAttendance() {
  const { lang } = useI18n();
  const { data, company } = useAuth();
  const ar = lang === "ar";
  const [place, setPlace] = useState("");
  const [pinLocation, setPinLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  const [, setNow] = useState(Date.now());

  const records = data?.personalAttendance || [];
  const openRec = records.find((r) => !r.checkOut);

  // Live elapsed-time ticker while checked in.
  useEffect(() => {
    if (!openRec) return;
    const iv = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(iv);
  }, [openRec?.id]);

  if (!data || !company) return null;

  // Old records stored a placeId — resolve it from the legacy places list.
  const recPlace = (r) => r.place || (data.personalPlaces || []).find((p) => p.id === r.placeId)?.name || "—";

  // Quick suggestions from previously visited places.
  const suggestions = [...new Set(records.map(recPlace).filter((n) => n !== "—"))].slice(0, 6);

  const saveVisit = (coords) => {
    updateCompany(company.id, (d) => {
      d.personalAttendance = d.personalAttendance || [];
      d.personalAttendance.unshift({
        id: uid(), place: place.trim(), date: localDate(),
        checkIn: new Date().toISOString(), checkOut: null,
        lat: coords?.lat ?? null, lng: coords?.lng ?? null,
      });
    });
    setPlace("");
  };

  const checkIn = () => {
    if (!place.trim()) return;
    if (!pinLocation || !navigator.geolocation) return saveVisit(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); saveVisit({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      () => { setLocating(false); saveVisit(null); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const checkOut = () => {
    if (!openRec) return;
    updateCompany(company.id, (d) => {
      const r = (d.personalAttendance || []).find((x) => x.id === openRec.id);
      if (r) r.checkOut = new Date().toISOString();
    });
  };

  const fmtTime = (iso) => new Date(iso).toLocaleTimeString(ar ? "ar-SA" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  const elapsedMin = openRec ? Math.max(0, Math.round((Date.now() - new Date(openRec.checkIn).getTime()) / 60000)) : 0;

  const durMin = (r) => Math.max(0, Math.round(((r.checkOut ? new Date(r.checkOut).getTime() : Date.now()) - new Date(r.checkIn).getTime()) / 60000));
  const exportRows = records.map((r) => [
    r.date, recPlace(r), fmtTime(r.checkIn),
    r.checkOut ? fmtTime(r.checkOut) : (ar ? "جارٍ الآن" : "ongoing"),
    `${Math.floor(durMin(r) / 60)}h ${durMin(r) % 60}m`,
    r.lat != null ? `${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}` : "",
  ]);
  const exportHeaders = ar
    ? ["التاريخ", "المكان", "دخول", "خروج", "المدة", "الموقع"]
    : ["Date", "Place", "In", "Out", "Duration", "Location"];

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "حضوري" : "My Attendance"}
        icon={ClipboardCheck}
        actions={<ExportButtons title={ar ? "سجل حضوري" : "My Attendance Log"} filename="my-attendance" headers={exportHeaders} rows={exportRows} ar={ar} />}
      />

      <div className="p-5 rounded-2xl border border-border bg-card">
        {openRec ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-body text-muted-foreground flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-accent" />
                {ar ? "أنت الآن في" : "You're checked in at"} <span className="font-medium text-foreground">{recPlace(openRec)}</span>
                {openRec.lat != null && <MapPin className="w-3.5 h-3.5 text-accent" />}
              </p>
              <p className="hero-title text-3xl mt-1">{Math.floor(elapsedMin / 60)}h {elapsedMin % 60}m</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{ar ? "منذ الساعة" : "Since"} {fmtTime(openRec.checkIn)}</p>
            </div>
            <button onClick={checkOut} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <LogOut className="w-4 h-4" /> {ar ? "تسجيل خروج" : "Check Out"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-body">
              {ar ? "أين أنت الآن؟" : "Where are you right now?"}
            </p>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => setPlace(s)} className={`px-3 py-1.5 rounded-full border text-xs font-body transition ${place === s ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkIn()}
                placeholder={ar ? "اكتب اسم المكان (المنزل، المكتب، النادي، مقهى...)" : "Type the place name (Home, Office, Gym, Café...)"}
                className="flex-1 min-w-[200px] px-3 py-2.5 rounded-xl border border-input text-sm font-body bg-background"
              />
              <button onClick={checkIn} disabled={!place.trim() || locating} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-40">
                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {locating ? (ar ? "تحديد الموقع..." : "Locating...") : (ar ? "سجّل زيارتي" : "Log my visit")}
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs font-body text-muted-foreground cursor-pointer w-fit">
              <input type="checkbox" checked={pinLocation} onChange={(e) => setPinLocation(e.target.checked)} className="accent-current" />
              <MapPin className="w-3.5 h-3.5 text-accent" />
              {ar ? "تثبيت موقعي الجغرافي مع الزيارة (اختياري)" : "Pin my GPS location with this visit (optional)"}
            </label>
          </div>
        )}
      </div>

      <AttendanceInsights records={records} placeName={recPlace} ar={ar} />
    </div>
  );
}