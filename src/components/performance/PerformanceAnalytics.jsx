import React, { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { canSeeAllStations, visibleStations } from "@/lib/permissions";
import moment from "moment";
import IssuesList from "@/components/performance/IssuesList";
import TrendKpiRow from "@/components/performance/TrendKpiRow";
import TrendCharts from "@/components/performance/TrendCharts";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";
import useMonthlyAttendance from "@/hooks/useMonthlyAttendance";
import { usePerformancePeriod } from "@/lib/PerformancePeriodContext";
import { monthLabel, trimLeadingEmpty, deltaPct, toArabicDigits } from "@/lib/trendFormat";

const weightOf = (item) => Number(item.effortWeight) || 1;

export default function PerformanceAnalytics() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const ar = lang === "ar";
  const { resolved, compare } = usePerformancePeriod();
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

    const { start: windowStart, end: windowEnd, previousStart, previousEnd, bucket } = resolved;
    const unit = bucket === "week" ? "isoWeek" : bucket;

    const buckets = [];
    const cur = moment(windowStart).startOf(unit);
    const endM = moment(windowEnd).endOf(unit);
    while (cur.isSameOrBefore(endM)) {
      const label =
        bucket === "day" ? (ar ? toArabicDigits(cur.format("D/M")) : cur.format("D/M")) :
        bucket === "week" ? (ar ? `أسبوع ${toArabicDigits(cur.format("D/M"))}` : cur.format("[w] D/M")) :
        monthLabel(cur.format("YYYY-MM"), ar);
      buckets.push({ key: cur.format("YYYY-MM-DD"), label, total: 0 });
      cur.add(1, bucket + "s");
    }
    const bucketIndex = (dateStr) => {
      if (!dateStr) return -1;
      const m = moment(dateStr);
      if (m.isBefore(windowStart) || m.isAfter(windowEnd)) return -1;
      const key = moment(m).startOf(unit).format("YYYY-MM-DD");
      return buckets.findIndex((b) => b.key === key);
    };
    const inPrevious = (dateStr) => {
      if (!dateStr) return false;
      const m = moment(dateStr);
      return m.isSameOrAfter(previousStart) && m.isSameOrBefore(previousEnd);
    };

    let totalWeight = 0;
    let previousWeight = 0;
    let onTime = 0;
    let overdue = 0;
    const now = moment();

    const visibleItems = [...(data.tasks || []), ...(data.targets || [])].filter((item) => {
      if (item.stationId && !visibleStationIds.has(item.stationId) && !seesAll) return false;
      if (item.assignedTo && !visibleEmpIds.has(item.assignedTo)) return false;
      return true;
    });

    for (const item of visibleItems) {
      const done = item.status === "completed" ? Math.max(1, Number(item.completed) || 1) : Number(item.completed) || 0;
      const earned = done * weightOf(item);
      const idx = bucketIndex(item.createdAt);
      if (earned > 0) {
        if (idx >= 0) { buckets[idx].total += earned; totalWeight += earned; }
        else if (inPrevious(item.createdAt)) previousWeight += earned;
      }
      const deadline = item.endDate || item.end_date;
      if (idx >= 0 && deadline) {
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
      periodCount: buckets.length,
      totalWeight,
      previousWeight,
      avgPerPeriod,
      peak,
      compliance: tracked ? Math.round((onTime / tracked) * 100) : null,
    };
  }, [data, currentUser, resolved, ar]);

  if (!data || !currentUser || !result) return null;

  const { buckets, periodCount, totalWeight, previousWeight, avgPerPeriod, peak, compliance } = result;

  const attendanceRows = trimLeadingEmpty(
    attendance.map((r) => ({ ...r, label: monthLabel(r.month, ar) })),
    (r) => r.avgRate != null || r.lateCount > 0
  );
  const num = (value) => (ar ? toArabicDigits(value) : value);
  const delta = (current, previous) => (compare ? deltaPct(current, previous) : null);

  const kpis = [
    { label: ar ? "الوزن المنجز" : "Completed weight", value: num(totalWeight), delta: delta(totalWeight, previousWeight) },
    { label: ar ? "المتوسط لكل فترة" : "Average per period", value: num(avgPerPeriod.toFixed(1)), delta: delta(avgPerPeriod, previousWeight / Math.max(periodCount, 1)) },
    { label: ar ? "أعلى فترة" : "Peak period", value: peak ? peak.label : "—", hint: peak ? `${num(peak.total)} ${ar ? "وزن" : "weight"}` : (ar ? "لا بيانات" : "no data") },
    { label: ar ? "الالتزام بالمهل" : "Deadline compliance", value: compliance == null ? "—" : `${num(compliance)}%`, hint: compliance == null ? (ar ? "لا مهل مسجلة" : "no deadlines recorded") : undefined },
  ];

  return (
    <div className="space-y-5">
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

      <div className="flex justify-end">
        <ComparisonExportButtons
          title={t("analytics")}
          headers={[t("category"), t("title"), t("completedTasks")]}
          rows={[
            ...buckets.map((r) => [ar ? "الوزن المنجز" : "Completed weight", r.label, r.total]),
            ...attendanceRows.map((r) => [ar ? "نسبة الحضور" : "Attendance %", r.label, r.avgRate ?? "—"]),
            ...attendanceRows.map((r) => [ar ? "حالات التأخير" : "Late", r.label, r.lateCount]),
          ]}
        />
      </div>

      <IssuesList />
    </div>
  );
}