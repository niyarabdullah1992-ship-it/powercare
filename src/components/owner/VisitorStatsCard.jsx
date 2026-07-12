import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart3, Users, Eye, CalendarDays, MapPin } from "lucide-react";

// Owner-only visitor analytics card shown in the Owner Panel.
export default function VisitorStatsCard({ lang }) {
  const ar = lang === "ar";
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    base44.functions
      .invoke("pageVisits", { action: "stats" })
      .then((res) => setStats(res.data))
      .catch(() => setError(true));
  }, []);

  const tiles = stats
    ? [
        { label: ar ? "زيارات اليوم" : "Visits today", value: stats.todayVisits, icon: Eye },
        { label: ar ? "زوار اليوم (فريد)" : "Unique today", value: stats.todayUnique, icon: Users },
        { label: ar ? "إجمالي الزيارات" : "Total visits", value: stats.totalVisits, icon: BarChart3 },
        { label: ar ? "إجمالي الزوار" : "Total unique", value: stats.totalUnique, icon: Users },
      ]
    : [];

  const maxDay = stats ? Math.max(1, ...stats.days.map((d) => d.visits)) : 1;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2 text-[#3a2f22]">
        <BarChart3 className="w-4 h-4" /> {ar ? "إحصائيات زوار الموقع" : "Website Visitor Stats"}
      </h3>

      {error ? (
        <p className="text-sm text-[#3a2f22]/40 font-body">{ar ? "تعذّر تحميل الإحصائيات." : "Couldn't load stats."}</p>
      ) : !stats ? (
        <p className="text-sm text-[#3a2f22]/40 font-body">…</p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tiles.map((tl) => (
              <div key={tl.label} className="p-3 rounded-lg bg-landing-bg text-center">
                <tl.icon className="w-4 h-4 mx-auto text-landing-gold mb-1" />
                <p className="text-2xl font-heading font-semibold text-[#3a2f22] leading-none">{tl.value}</p>
                <p className="text-[11px] text-[#3a2f22]/50 font-body mt-1">{tl.label}</p>
              </div>
            ))}
          </div>

          {/* Last 7 days mini bar chart */}
          <div>
            <p className="text-xs text-[#3a2f22]/50 font-body mb-2 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> {ar ? "آخر 7 أيام" : "Last 7 days"}
            </p>
            <div className="flex items-end gap-2 h-24">
              {stats.days.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-[#3a2f22]/60 font-body">{d.visits}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-landing-gold to-landing-gold-light"
                    style={{ height: `${Math.max((d.visits / maxDay) * 100, 4)}%` }}
                  />
                  <span className="text-[9px] text-[#3a2f22]/40 font-body">{d.day.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visitor locations */}
          <div>
            <p className="text-xs text-[#3a2f22]/50 font-body mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {ar ? "مواقع الزوار" : "Visitor locations"}
            </p>
            {(!stats.locations || stats.locations.length === 0) ? (
              <p className="text-xs text-[#3a2f22]/40 font-body">
                {ar ? "لا توجد بيانات مواقع بعد — ستظهر مع الزيارات الجديدة." : "No location data yet — it will appear with new visits."}
              </p>
            ) : (
              <div className="space-y-1.5">
                {stats.locations.map((l) => (
                  <div key={`${l.country}-${l.city}`} className="flex items-center justify-between p-2.5 rounded-lg bg-landing-bg">
                    <p className="text-sm font-body text-[#3a2f22] truncate">
                      {l.country}{l.city ? ` — ${l.city}` : ""}
                    </p>
                    <p className="text-xs text-[#3a2f22]/50 font-body shrink-0 ms-3">
                      {l.visits} {ar ? "زيارة" : "visits"} · {l.unique} {ar ? "زائر" : "unique"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}