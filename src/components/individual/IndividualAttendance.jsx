import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany } from "@/lib/store";
import { ClipboardCheck, LogIn, LogOut, Timer } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import PlaceManager from "@/components/individual/PlaceManager";
import AttendanceInsights from "@/components/individual/AttendanceInsights";

const uid = () => `patt_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function IndividualAttendance() {
  const { lang } = useI18n();
  const { data, company } = useAuth();
  const ar = lang === "ar";
  const [selectedPlace, setSelectedPlace] = useState("");
  const [, setNow] = useState(Date.now());

  const places = data?.personalPlaces || [];
  const records = data?.personalAttendance || [];
  const openRec = records.find((r) => !r.checkOut);

  // Live elapsed-time ticker while checked in.
  useEffect(() => {
    if (!openRec) return;
    const iv = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(iv);
  }, [openRec?.id]);

  useEffect(() => {
    if (!selectedPlace && places.length > 0) setSelectedPlace(places[0].id);
  }, [places.length]);

  if (!data || !company) return null;

  const placeName = (id) => places.find((p) => p.id === id)?.name || (ar ? "مقر محذوف" : "Deleted place");

  const checkIn = () => {
    if (!selectedPlace) return;
    updateCompany(company.id, (d) => {
      d.personalAttendance = d.personalAttendance || [];
      d.personalAttendance.unshift({ id: uid(), placeId: selectedPlace, date: localDate(), checkIn: new Date().toISOString(), checkOut: null });
    });
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

  return (
    <div className="space-y-6">
      <PageHeader title={ar ? "حضوري" : "My Attendance"} icon={ClipboardCheck} />

      <PlaceManager places={places} companyId={company.id} selected={selectedPlace} onSelect={setSelectedPlace} ar={ar} />

      <div className="p-5 rounded-2xl border border-border bg-card">
        {openRec ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-body text-muted-foreground flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-accent" />
                {ar ? "أنت الآن داخل" : "You're checked in at"} <span className="font-medium text-foreground">{placeName(openRec.placeId)}</span>
              </p>
              <p className="hero-title text-3xl mt-1">{Math.floor(elapsedMin / 60)}h {elapsedMin % 60}m</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{ar ? "منذ الساعة" : "Since"} {fmtTime(openRec.checkIn)}</p>
            </div>
            <button onClick={checkOut} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <LogOut className="w-4 h-4" /> {ar ? "تسجيل خروج" : "Check Out"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground font-body">
              {places.length === 0
                ? (ar ? "أضف مقرًا يناسبك (المنزل، المكتب، المقهى...) لتبدأ تتبع وقتك." : "Add any place you like (home, office, café...) to start tracking your time.")
                : (ar ? "اختر مقرك ثم اضغط لتسجيل دخولك." : "Pick your place, then tap to check in.")}
            </p>
            <button onClick={checkIn} disabled={!selectedPlace} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-40">
              <LogIn className="w-4 h-4" /> {ar ? "تسجيل حضور" : "Check In"}
            </button>
          </div>
        )}
      </div>

      <AttendanceInsights records={records} placeName={placeName} ar={ar} />
    </div>
  );
}