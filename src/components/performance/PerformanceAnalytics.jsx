import React, { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { canSeeAllStations, visibleStations } from "@/lib/permissions";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Calendar, TrendingUp, Users, Building2, BarChart3 } from "lucide-react";
import moment from "moment";

const RANGES = [
  { val: "daily", bucket: "day", count: 14 },
  { val: "weekly", bucket: "week", count: 8 },
  { val: "monthly", bucket: "month", count: 6 },
  { val: "3months", bucket: "month", count: 3 },
  { val: "yearly", bucket: "month", count: 12 },
  { val: "custom", bucket: "auto" },
];

const rangeLabel = (val, t) => ({
  daily: t("rangeDaily"),
  weekly: t("rangeWeekly"),
  monthly: t("rangeMonthly"),
  "3months": t("range3Months"),
  yearly: t("rangeYearly"),
  custom: t("rangeCustom"),
}[val] || val);

export default function PerformanceAnalytics() {
  const { t, dir } = useI18n();
  const { data, currentUser } = useAuth();
  const [range, setRange] = useState("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const result = useMemo(() => {
    if (!data || !currentUser) return null;

    const seesAll = canSeeAllStations(currentUser);
    const stations = visibleStations(currentUser, data);
    const visibleStationIds = new Set(stations.map((s) => s.id));
    const visibleEmpIds = new Set(
      data.employees
        .filter((e) => (e.stationId ? visibleStationIds.has(e.stationId) : seesAll))
        .map((e) => e.id)
    );

    const cfg = RANGES.find((r) => r.val === range);
    let windowStart, windowEnd = new Date();
    let bucket = cfg.bucket;

    if (range === "custom") {
      windowStart = customStart ? new Date(customStart) : new Date(0);
      windowEnd = customEnd ? new Date(customEnd) : new Date();
      const spanDays = (windowEnd - windowStart) / 86400000;
      bucket = spanDays <= 60 ? "day" : spanDays <= 365 ? "week" : "month";
    } else {
      windowStart = moment().subtract(cfg.count, cfg.bucket + "s").toDate();
    }

    // Build bucket list
    const buckets = [];
    let cur = moment(windowStart).startOf(bucket === "week" ? "isoWeek" : bucket);
    const endM = moment(windowEnd).endOf(bucket === "week" ? "isoWeek" : bucket);
    while (cur.isSameOrBefore(endM)) {
      const key = cur.format("YYYY-MM-DD");
      const label =
        bucket === "day" ? cur.format("D/M") :
        bucket === "week" ? cur.format("[W]w") :
        cur.format("MMM YY");
      buckets.push({ key, label, total: 0 });
      cur.add(1, bucket + "s");
    }
    const bucketIndex = (dateStr) => {
      if (!dateStr) return -1;
      const m = moment(dateStr);
      if (m.isBefore(windowStart) || m.isAfter(windowEnd)) return -1;
      const startOf = moment(m).startOf(bucket === "week" ? "isoWeek" : bucket);
      return buckets.findIndex((b) => b.key === startOf.format("YYYY-MM-DD"));
    };

    const empMap = {};
    const stationMap = {};
    let totalCompleted = 0;

    // Completed tasks (status === completed) — +1 each, attributed by createdAt
    for (const tk of data.tasks || []) {
      if (tk.status !== "completed") continue;
      if (tk.stationId && !visibleStationIds.has(tk.stationId)) continue;
      if (tk.assignedTo && !visibleEmpIds.has(tk.assignedTo)) continue;
      const idx = bucketIndex(tk.createdAt);
      if (idx >= 0) {
        buckets[idx].total += 1;
        totalCompleted += 1;
      }
      if (tk.assignedTo) empMap[tk.assignedTo] = (empMap[tk.assignedTo] || 0) + 1;
      if (tk.stationId) stationMap[tk.stationId] = (stationMap[tk.stationId] || 0) + 1;
    }

    // Targets — contribute their completed count, attributed by createdAt
    for (const tg of data.targets || []) {
      const completed = Number(tg.completed) || 0;
      if (completed <= 0) continue;
      if (tg.stationId && !visibleStationIds.has(tg.stationId)) continue;
      if (tg.assignedTo && !visibleEmpIds.has(tg.assignedTo)) continue;
      const idx = bucketIndex(tg.createdAt);
      if (idx >= 0) {
        buckets[idx].total += completed;
        totalCompleted += completed;
      }
      if (tg.assignedTo) empMap[tg.assignedTo] = (empMap[tg.assignedTo] || 0) + completed;
      if (tg.stationId) stationMap[tg.stationId] = (stationMap[tg.stationId] || 0) + completed;
    }

    const employeeName = (id) => data.employees.find((e) => e.id === id)?.name || "—";
    const stationName = (id) => data.stations.find((s) => s.id === id)?.name || t("hq");

    const perEmployee = Object.entries(empMap)
      .map(([id, value]) => ({ name: employeeName(id), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const perStation = Object.entries(stationMap)
      .map(([id, value]) => ({ name: stationName(id), value }))
      .sort((a, b) => b.value - a.value);

    const nonEmpty = buckets.filter((b) => b.total > 0);
    const avgPerPeriod = buckets.length ? (totalCompleted / buckets.length) : 0;
    const peak = nonEmpty.length ? nonEmpty.reduce((a, b) => (b.total > a.total ? b : a)) : null;

    return { buckets, perEmployee, perStation, totalCompleted, avgPerPeriod, peak };
  }, [data, currentUser, range, customStart, customEnd]);

  if (!data || !currentUser) return null;
  if (!result) return null;

  const { buckets, perEmployee, perStation, totalCompleted, avgPerPeriod, peak } = result;
  const hasData = totalCompleted > 0;

  const axisProps = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false };
  const tooltipStyle = {
    contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 },
    labelStyle: { color: "hsl(var(--foreground))" },
  };

  return (
    <div className="space-y-5">
      {/* Range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          {RANGES.map((r) => (
            <button
              key={r.val}
              onClick={() => setRange(r.val)}
              className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${range === r.val ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
            >
              {rangeLabel(r.val, t)}
            </button>
          ))}
        </div>
        {range === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-2.5 py-1.5 rounded-md border border-input text-xs font-body" />
            <span className="text-muted-foreground text-xs">—</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-2.5 py-1.5 rounded-md border border-input text-xs font-body" />
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-1">
            <BarChart3 className="w-3.5 h-3.5" /> {t("totalCompleted")}
          </div>
          <p className="text-2xl font-heading font-semibold">{totalCompleted}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> {t("avgPerPeriod")}
          </div>
          <p className="text-2xl font-heading font-semibold">{avgPerPeriod.toFixed(1)}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-1">
            <Calendar className="w-3.5 h-3.5" /> {t("peakPeriod")}
          </div>
          <p className="text-2xl font-heading font-semibold">{peak ? peak.label : "—"}</p>
          {peak && <p className="text-xs text-muted-foreground font-body">{peak.total} {t("tasksUnit")}</p>}
        </div>
      </div>

      {!hasData ? (
        <div className="p-8 rounded-xl border border-border bg-card text-center">
          <p className="text-sm text-muted-foreground font-body">{t("noAnalyticsData")}</p>
        </div>
      ) : (
        <>
          {/* Productivity trend */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-heading text-base font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4" /> {t("productivityTrend")}
            </h3>
            <div className="w-full h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={buckets} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={20} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="total" name={t("completedTasks")} stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#prodGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Per employee */}
            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-heading text-base font-semibold flex items-center gap-2 mb-4">
                <Users className="w-4 h-4" /> {t("perEmployee")}
              </h3>
              {perEmployee.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body">{t("noAnalyticsData")}</p>
              ) : (
                <div className="w-full h-72" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perEmployee} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" {...axisProps} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" {...axisProps} width={90} />
                      <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
                      <Bar dataKey="value" name={t("completedTasks")} fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Per station */}
            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-heading text-base font-semibold flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4" /> {t("perStation")}
              </h3>
              {perStation.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body">{t("noAnalyticsData")}</p>
              ) : (
                <div className="w-full h-72" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perStation} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" {...axisProps} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" {...axisProps} width={90} />
                      <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
                      <Bar dataKey="value" name={t("completedTasks")} fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}