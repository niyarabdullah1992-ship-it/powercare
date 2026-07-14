import React from "react";
import { History } from "lucide-react";

const durMin = (r) => Math.max(0, Math.round(((r.checkOut ? new Date(r.checkOut).getTime() : Date.now()) - new Date(r.checkIn).getTime()) / 60000));
const fmtDur = (min) => `${Math.floor(min / 60)}h ${min % 60}m`;

export default function AttendanceInsights({ records, placeName, ar }) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const weekAgo = now.getTime() - 7 * 86400000;
  const todayMin = records.filter((r) => r.date === todayStr).reduce((s, r) => s + durMin(r), 0);
  const weekRecs = records.filter((r) => new Date(r.checkIn).getTime() >= weekAgo);
  const weekMin = weekRecs.reduce((s, r) => s + durMin(r), 0);
  const avgIn = weekRecs.length
    ? Math.round(weekRecs.reduce((s, r) => { const d = new Date(r.checkIn); return s + d.getHours() * 60 + d.getMinutes(); }, 0) / weekRecs.length)
    : null;
  const fmtClock = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString(ar ? "ar-SA" : "en-GB", { hour: "2-digit", minute: "2-digit" });

  const stats = [
    { label: ar ? "اليوم" : "Today", value: fmtDur(todayMin) },
    { label: ar ? "هذا الأسبوع" : "This week", value: fmtDur(weekMin) },
    { label: ar ? "جلسات الأسبوع" : "Week sessions", value: weekRecs.length },
    { label: ar ? "متوسط الدخول" : "Avg check-in", value: avgIn == null ? "—" : fmtClock(avgIn) },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-2xl border border-border bg-card text-center">
            <p className="hero-title text-2xl">{s.value}</p>
            <p className="text-[10px] tracking-widest-xl uppercase text-muted-foreground font-body mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-body flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" /> {ar ? "سجل الدخول والخروج" : "Entry & exit log"}
        </p>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">{ar ? "لا توجد سجلات حضور بعد." : "No attendance records yet."}</p>
        ) : (
          <div className="divide-y divide-border">
            {records.slice(0, 20).map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-sm font-body">
                <div className="min-w-0">
                  <p className="font-medium truncate">{placeName(r.placeId)}</p>
                  <p className="text-xs text-muted-foreground">{r.date}</p>
                </div>
                <div className="text-end shrink-0">
                  <p>{fmtTime(r.checkIn)} → {r.checkOut ? fmtTime(r.checkOut) : (ar ? "جارٍ الآن" : "ongoing")}</p>
                  <p className="text-xs text-accent">{fmtDur(durMin(r))}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}