import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";

// Manager-only analytics: attendance rate and late frequency compared across the team.
export default function AttendanceAnalytics({ employees, t }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employees.length || !month) return;
    setLoading(true);
    base44.functions.invoke("supabaseAttendance", {
      action: "getAnalytics",
      userRole: "director",
      employeeIds: employees.map((e) => e.id),
      month,
    })
      .then((res) => setStats(res?.data?.stats || []))
      .catch(() => setStats([]))
      .finally(() => setLoading(false));
  }, [employees.map((e) => e.id).join(","), month]);

  const nameOf = (id) => employees.find((e) => e.id === id)?.name || "—";
  const chartData = stats.map((s) => ({
    name: nameOf(s.employeeId),
    attendanceRate: s.attendanceRate ?? 0,
    lateCount: s.late + s.excusedLate,
    avgLateMinutes: s.avgLateMinutes,
    onLeave: s.onLeave || 0,
  }));
  const avgRate = stats.length
    ? Math.round((stats.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / stats.length) * 10) / 10
    : 0;

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-heading text-lg font-semibold">{t("employeeComparisonLabel")}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <ComparisonExportButtons
            title={`${t("employeeComparisonLabel")} — ${month}`}
            headers={[t("employeeName"), t("attendanceRateLabel"), t("lateFrequencyLabel"), t("avgLateMinutes"), t("onLeaveStatus")]}
            rows={chartData.map((r) => [r.name, `${r.attendanceRate}%`, r.lateCount, r.avgLateMinutes, r.onLeave])}
          />
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body" />
        </div>
      </div>

      <div className="p-3 rounded-lg border border-border bg-muted inline-block">
        <p className="text-lg font-semibold">{avgRate}%</p>
        <p className="text-[11px] text-muted-foreground font-body">{t("avgAttendanceRate")}</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground font-body">…</p>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{t("noAnalyticsDataAttendance")}</p>
      ) : (
        <>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("attendanceRateLabel")}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Bar dataKey="attendanceRate" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("lateFrequencyLabel")}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="lateCount" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}