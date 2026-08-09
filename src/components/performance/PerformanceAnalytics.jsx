import React, { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { canSeeAllStations, visibleStations } from "@/lib/permissions";
import moment from "moment";
import IssuesList from "@/components/performance/IssuesList";
import TrendPeriodBar from "@/components/performance/TrendPeriodBar";
import TrendKpiRow from "@/components/performance/TrendKpiRow";
import TrendCharts from "@/components/performance/TrendCharts";
import useMonthlyAttendance from "@/hooks/useMonthlyAttendance";
import { monthLabel, trimLeadingEmpty, deltaPct, toArabicDigits } from "@/lib/trendFormat";

const RANGES = [
  { val: "daily", bucket: "day", count: 14 },
  { val: "weekly", bucket: "week", count: 8 },
  { val: "monthly", bucket: "month", count: 6 },
  { val: "3months", bucket: "month", count: 3 },
  { val: "yearly", bucket: "month", count: 12 },
  { val: "custom", bucket: "auto" },
];

const weightOf = (item) => Number(item.effortWeight) || 1;

export default function PerformanceAnalytics() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const ar = lang === "ar";
  const [range, setRange] = useState("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const { rows: attendance } = useMonthlyAttendance(company, data?.employees || []);

  const result = useMemo(() => {
    if (!data || !currentUser) return null;

    const seesAll = canSeeAllStations(currentUser);
    const stations = visibleStations(currentUser, data);
    const visibleStationIds = new Set(stations.map((s) => s.id));
    const defaultStationId = data.stations?.[0]?.id || null;
    const visibleEmpIds = new Set(
      data.employees
        .filter((e) => visibleStationIds.has(e.stationId || defaultStationId) || seesAll)
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
    const previousStart = new Date(windowStart.getTime() - (windowEnd - windowStart));

    const buckets = [];
    let cur = moment(windowStart).startOf(bucket === "week" ? "isoWeek" : bucket);
    const endM = moment(windowEnd).endOf(bucket === "week" ? "isoWeek" : bucket);
    while (cur.isSameOrBefore(endM)) {
      const label =
        bucket === "day" ? (ar ? toArabicDigits(cur.format("D/M")) : cur.format("D/M")) :
        bucket === "week" ? (ar ? `أ${toArabicDigits(cur.format("w"))}` : cur.format("[W]w")) :
        monthLabel(cur.format("YYYY-MM"), ar);
      buckets.push({ key: cur.format("YYYY-MM-DD"), label, total: 0 });
      cur.add(1, bucket + "s");
    }
    const bucketIndex = (dateStr) => {
      if (!dateStr) return -1;
      const m = moment(dateStr);
      if (m.isBefore(windowStart) || m.isAfter(windowEnd)) return -1;
      const startOf = moment(m).startOf(bucket === "week" ? "isoWeek" : bucket);
      return buckets.findIndex((b) => b.key === startOf.format("YYYY-MM-DD"));
    };
    const inPrevious = (dateStr) => {
      if (!dateStr) return false;
      const m = moment(dateStr);
      return m.isSameOrAfter(previousStart) && m.isBefore(windowStart);
    };

    let totalWeight = 0;
    let previousWeight = 0;
    let onTime = 0;
    let overdue = 0;
    const now = moment();

    const visibleItems = [...(data.tasks || []), ...(data.targets || [])].filter((item) => {
      if (item.stationId && !visibleStationIds.has(item.stationId)) return false;
      if (item.assignedTo && !visibleEmpIds.has(item.assignedTo)) return false;
      return true;
    });

    for (const item of visibleItems) {
      const done = item.status === "completed" ? Math.max(1, Number(item.completed) || 1) : Number(item.completed) || 0;
      const earned = done * weightOf(item);
      if (earned > 0) {
        const idx = bucketIndex(item.createdAt);
        if (idx >= 0) { buckets[idx].total += earned; totalWeight += earned; }
        else if (inPrevious(item.createdAt)) previousWeight += earned;
      }
      const deadline = item.endDate || item.end_date;
      if (bucketIndex(item.createdAt) >= 0 && deadline) {
        if (item.status === "completed") onTime += 1;
        else if (moment(deadline).isBefore(now)) overdue += 1;
      }
    }

    const nonEmpty = buckets.filter((b) => b.total > 0);
    const avgPerPeriod = buckets.length ? totalWeight / buckets.length : 0;
    const peak = nonEmpty.length ? nonEmpty.reduce((a, b) => (b.total > a.total ? b : a)) : null;
    const tracked = onTime + overdue;

    return {
      buckets: trimLeadingEmpty(buckets, (b) => b.total > 0),
      totalWeight,
      previousWeight,
      avgPerPeriod,
      peak,
      compliance: tracked ? Math.round((onTime / tracked) * 100) : null,
    };
  }, [data, currentUser, range, customStart, customEnd, ar]);

  if (!data || !currentUser || !result) return null;

  const { buckets, totalWeight, previousWeight, avgPerPeriod, peak, compliance } = result;

  const attendanceRows = trimLeadingEmpty(
    attendance.map((r) => ({ ...r, label: monthLabel(r.month, ar) })),
    (r) => r.avgRate != null || r.lateCount > 0
  );
  const num = (value) => (ar ? toArabicDigits(value) : value);

  const kpis = [
    { label: ar ? "الوزن المنجز" : "Completed weight", value: num(totalWeight), delta: deltaPct(totalWeight, previousWeight) },
    { label: ar ? "المتوسط لكل فترة" : "Average per period", value: num(avgPerPeriod.toFixed(1)), delta: deltaPct(avgPerPeriod, previousWeight / Math.max(buckets.length, 1)) },
    { label: ar ? "أعلى فترة" : "Peak period", value: peak ? peak.label : "—", hint: peak ? `${num(peak.total)} ${ar ? "وزن" : "weight"}` : (ar ? "لا بيانات" : "no data") },
    { label: ar ? "الالتزام بالمهل" : "Deadline compliance", value: compliance == null ? "—" : `${num(compliance)}%`, hint: compliance == null ? (ar ? "لا مهل مسجلة" : "no deadlines recorded") : undefined, delta: null },
  ];

  return (
    <div className="space-y-5">
      <TrendPeriodBar
        ranges={RANGES}
        range={range}
        onRange={setRange}
        rangeLabel={(val) => ({
          daily: t("rangeDaily"), weekly: t("rangeWeekly"), monthly: t("rangeMonthly"),
          "3months": t("range3Months"), yearly: t("rangeYearly"), custom: t("rangeCustom"),
        }[val] || val)}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStart={setCustomStart}
        onCustomEnd={setCustomEnd}
        exportProps={{
          title: t("analytics"),
          headers: [t("category"), t("title"), t("completedTasks")],
          rows: [
            ...buckets.map((r) => [ar ? "الوزن المنجز" : "Completed weight", r.label, r.total]),
            ...attendanceRows.map((r) => [ar ? "نسبة الحضور" : "Attendance %", r.label, r.avgRate ?? "—"]),
            ...attendanceRows.map((r) => [ar ? "حالات التأخير" : "Late", r.label, r.lateCount]),
          ],
        }}
      />

      <TrendKpiRow items={kpis} ar={ar} />

      <TrendCharts
        weightRows={buckets}
        attendanceRows={attendanceRows}
        lateRows={attendanceRows}
        labels={{
          weight: ar ? "الوزن المنجز" : "Completed weight",
          attendance: ar ? "نسبة الحضور" : "Attendance rate",
          late: ar ? "حالات التأخير" : "Late check-ins",
        }}
      />

      <IssuesList />
    </div>
  );
}