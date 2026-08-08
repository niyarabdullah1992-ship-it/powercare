import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";

// «الحضور خلال الأسبوع» — أعمدة خضراء بنسبة حضور آخر ٥ أيام، بأسلوب تصميم NiroVera.
export default function WeeklyAttendanceCard({ companyId, employeeIds, lang }) {
  const ar = lang === "ar";
  const [days, setDays] = useState([]);

  useEffect(() => {
    if (!companyId || !employeeIds?.length) return;
    let cancelled = false;
    const load = async () => {
      const dates = [];
      for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d);
      }
      const results = await Promise.all(dates.map(async (d) => {
        const dateKey = d.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
        try {
          const res = await base44.functions.invoke("supabaseAttendance", {
            action: "listDaily", employeeIds, date: dateKey,
            companyId, sessionToken: getCompanyToken(companyId),
          });
          const rows = res?.data?.rows || [];
          const present = new Set(rows.filter((r) => ["present", "late"].includes(r.status)).map((r) => r.employee_id)).size;
          return {
            label: new Intl.DateTimeFormat(ar ? "ar" : "en", { weekday: "long" }).format(d),
            pct: Math.round((present / employeeIds.length) * 100),
          };
        } catch {
          return { label: new Intl.DateTimeFormat(ar ? "ar" : "en", { weekday: "long" }).format(d), pct: 0 };
        }
      }));
      if (!cancelled) setDays(results);
    };
    load();
    return () => { cancelled = true; };
  }, [companyId, employeeIds?.length]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-heading text-base font-semibold mb-4">{ar ? "الحضور خلال الأسبوع" : "Attendance this week"}</h3>
      {days.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{ar ? "جارٍ التحميل..." : "Loading..."}</p>
      ) : (
        <div className="flex items-end justify-between gap-3 h-44">
          {days.map((day) => (
            <div key={day.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-xs font-heading font-semibold text-primary">%{day.pct}</span>
              <div
                className="w-full max-w-[52px] rounded-sm bg-accent"
                style={{ height: `${Math.max(day.pct, 4)}%` }}
              />
              <span className="text-[11px] font-body text-muted-foreground truncate">{day.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}