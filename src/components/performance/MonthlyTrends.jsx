import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { TrendingUp, Loader2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

// لوحة التحليلات الزمنية (للمدراء): مقارنة الحضور والمهام شهرًا بشهر لآخر ٦ أشهر.
function lastMonths(n) {
  const out = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export default function MonthlyTrends() {
  const { lang } = useI18n();
  const { data, company } = useAuth();
  const isAr = lang === "ar";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const months = lastMonths(6);
    const employeeIds = (data?.employees || []).map((e) => e.id);
    const auth = { companyId: company.id, sessionToken: getCompanyToken(company.id) };

    (async () => {
      // Attendance: one analytics call per month, in parallel.
      const attendancePromises = employeeIds.length
        ? months.map((month) =>
            base44.functions
              .invoke("supabaseAttendance", { action: "getAnalytics", employeeIds, month, ...auth })
              .then((res) => res?.data?.stats || [])
              .catch(() => [])
          )
        : months.map(() => Promise.resolve([]));
      // Tasks: one fetch, grouped by month below.
      const targetsPromise = base44.functions
        .invoke("supabaseTargets", { action: "listTargets", ...auth })
        .then((res) => res?.data?.targets || [])
        .catch(() => []);

      const [attendanceByMonth, targets] = await Promise.all([Promise.all(attendancePromises), targetsPromise]);
      if (!active) return;

      const result = months.map((month, i) => {
        const stats = attendanceByMonth[i];
        const rated = stats.filter((s) => s.attendanceRate != null);
        const avgRate = rated.length
          ? Math.round((rated.reduce((sum, s) => sum + s.attendanceRate, 0) / rated.length) * 10) / 10
          : null;
        const lateCount = stats.reduce((sum, s) => sum + (s.late || 0) + (s.excusedLate || 0), 0);
        const created = targets.filter((tg) => (tg.created_at || "").slice(0, 7) === month).length;
        const completed = targets.filter((tg) => tg.status === "completed" && (tg.end_date || tg.created_at || "").slice(0, 7) === month).length;
        return { month, avgRate, lateCount, created, completed };
      });
      setRows(result);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [company.id]);

  const L = (ar, en) => (isAr ? ar : en);

  if (loading) {
    return (
      <div className="p-10 rounded-xl border border-border bg-card flex items-center justify-center gap-2 text-sm text-muted-foreground font-body">
        <Loader2 className="w-4 h-4 animate-spin text-accent" /> {L("جاري تحليل آخر ٦ أشهر…", "Analyzing the last 6 months…")}
      </div>
    );
  }

  const hasAttendance = rows.some((r) => r.avgRate != null || r.lateCount > 0);
  const hasTasks = rows.some((r) => r.created > 0 || r.completed > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-accent" />
        <h3 className="font-heading text-lg font-semibold">{L("التحليلات الزمنية — آخر ٦ أشهر", "Monthly Trends — Last 6 Months")}</h3>
      </div>

      {!hasAttendance && !hasTasks ? (
        <p className="text-sm text-muted-foreground font-body p-5 rounded-xl border border-border bg-card">
          {L("لا توجد بيانات كافية بعد — ستظهر الاتجاهات تلقائيًا مع تراكم سجلات الحضور والمهام.", "Not enough data yet — trends will appear automatically as attendance and task records accumulate.")}
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* متوسط نسبة الحضور */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{L("متوسط نسبة الحضور %", "Avg Attendance Rate %")}</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="avgRate" name={L("نسبة الحضور", "Attendance %")} stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* حالات التأخير */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{L("حالات التأخير", "Late Check-ins")}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="lateCount" name={L("تأخيرات", "Late")} fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* المهام: جديدة مقابل منجزة */}
          <div className="p-5 rounded-xl border border-border bg-card lg:col-span-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{L("المهام — جديدة مقابل منجزة", "Tasks — Created vs Completed")}</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="created" name={L("مهام جديدة", "Created")} fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name={L("منجزة", "Completed")} fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}