import React, { useState } from "react";
import { useAuth } from "@/lib/PowerCareAuth";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import { FileSpreadsheet, FileText, CalendarRange } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";
import { canUsePlanFeature } from "@/lib/navVisibility";
import PlanFeatureNotice from "@/components/subscription/PlanFeatureNotice";

// تقرير زمني للمهام: شهر / ٣ أشهر / ٦ أشهر / سنة / عدد أيام / بين تاريخين — PDF وExcel.
const PRESETS = [
  { val: "month", months: 1 },
  { val: "3months", months: 3 },
  { val: "6months", months: 6 },
  { val: "year", months: 12 },
  { val: "days", months: 0 },
  { val: "range", months: 0 },
];

export default function TaskReportExport({ targets, t, lang, dir, stationKeyOf, defaultStation }) {
  const { data, company } = useAuth();
  const [preset, setPreset] = useState("month");
  const [stationFilter, setStationFilter] = useState(defaultStation || "all");
  const [days, setDays] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const ar = lang === "ar";
  const L = (a, e) => (ar ? a : e);
  const branding = data?.reportBranding || {};
  const color = branding.color || "#b07d3f";
  if (!canUsePlanFeature(company, "exports")) return <PlanFeatureNotice />;

  const presetLabel = (val) => ({
    month: L("شهر", "1 Month"),
    "3months": L("٣ أشهر", "3 Months"),
    "6months": L("٦ أشهر", "6 Months"),
    year: L("سنة", "1 Year"),
    days: L("تحديد أيام", "Custom Days"),
    range: L("بين تاريخين", "Date Range"),
  })[val];

  // Report window: presets look BACK from today; range uses the two picked dates.
  const computeWindow = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    if (preset === "range") {
      if (!from || !to) return null;
      const s = new Date(from);
      const e = new Date(to);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    if (preset === "days") {
      const n = Number(days);
      if (!n || n < 1) return null;
      const s = new Date();
      s.setDate(s.getDate() - n);
      s.setHours(0, 0, 0, 0);
      return { start: s, end };
    }
    const months = PRESETS.find((p) => p.val === preset)?.months || 1;
    const s = new Date();
    s.setMonth(s.getMonth() - months);
    s.setHours(0, 0, 0, 0);
    return { start: s, end };
  };

  const firstStationId = data?.stations?.[0]?.id || null;
  const stationName = (id) => data?.stations.find((s) => s.id === (id || firstStationId))?.name || "—";
  const employeeName = (id) => data?.employees.find((e) => e.id === id)?.name || "—";
  const assigneeOf = (tg) => {
    if (tg.assignment_type === "member") return employeeName(tg.employee_id);
    if (tg.assignment_type === "station_team") return `${t("stationTeam")}: ${stationName(tg.assignment_id)}`;
    if (tg.assignment_type === "hq_team") return `${t("stationTeam")}: ${stationName(firstStationId)}`;
    return employeeName(tg.employee_id);
  };
  const statusLabel = (s) => ({
    active: t("inProgress"), completed: t("completed"), overdue: t("overdue"),
    pending_review: L("قيد المراجعة", "Pending review"), stopped: L("متوقفة", "Stopped"),
  })[s] || s;
  const fmt = (d) => (d ? new Date(d).toLocaleDateString(ar ? "ar-SA" : "en-GB") : "—");

  // A task belongs to the period if its date range overlaps the report window.
  const buildReport = () => {
    const win = computeWindow();
    if (!win) {
      alert(preset === "range" ? L("اختر التاريخين أولًا", "Pick both dates first") : L("أدخل عدد الأيام", "Enter the number of days"));
      return null;
    }
    const scoped = stationFilter === "all"
      ? targets
      : targets.filter((tg) => (stationKeyOf ? stationKeyOf(tg) : tg.station_id) === stationFilter);
    const rows = scoped.filter((tg) => {
      const s = new Date(tg.start_date || tg.created_at);
      const e = new Date(tg.end_date || tg.start_date || tg.created_at);
      return s <= win.end && e >= win.start;
    });
    const stationLabel = stationFilter === "all" ? L("كل المحطات", "All stations") : stationName(stationFilter);
    const periodLabel = `${stationLabel} • ${fmt(win.start)} → ${fmt(win.end)}`;
    return { rows, periodLabel };
  };

  const headers = [
    L("المهمة", "Task"), L("القسم", "Section"), L("المحطة", "Station"), L("المسند إليه", "Assignee"),
    L("الأولوية", "Priority"), L("الحالة", "Status"), L("الإنجاز", "Progress"),
    L("البداية", "Start"), L("النهاية", "End"),
  ];
  const toRow = (tg) => [
    tg.title || "—",
    tg.section || "—",
    stationName(tg.assignment_type === "hq_team" ? firstStationId : (tg.station_id || tg.assignment_id)),
    assigneeOf(tg),
    ({ urgent: t("urgent"), high: t("high"), medium: t("medium"), low: t("low") })[tg.priority] || tg.priority || "—",
    statusLabel(tg.status),
    `${tg.completed_tasks || 0} / ${tg.task_target || 0}`,
    fmt(tg.start_date),
    fmt(tg.end_date),
  ];

  const exportExcel = () => {
    const report = buildReport();
    if (!report) return;
    exportExcelColored({
      filename: `tasks_report_${new Date().toISOString().slice(0, 10)}`,
      title: `${L("تقرير المهام", "Tasks Report")} — ${report.periodLabel}`,
      headers,
      rows: report.rows.map(toRow),
      color,
      dir,
    });
  };

  const exportPdf = () => {
    const report = buildReport();
    if (!report) return;
    const done = report.rows.filter((x) => x.status === "completed").length;
    const overdue = report.rows.filter((x) => x.status === "overdue").length;
    const makeChart = (title, values) => {
      const entries = Object.entries(values).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const max = Math.max(...entries.map(([, value]) => value), 1);
      return { title, entries: entries.map(([label, value]) => ({ label, value, display: String(value), percent: Math.round((value / max) * 100) })) };
    };
    const countBy = (keyOf) => report.rows.reduce((counts, task) => {
      const key = keyOf(task) || "—";
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
    printReport({
      title: L("تقرير المهام", "Tasks Report"),
      companyName: data?.name || "",
      periodLabel: report.periodLabel,
      dir,
      logoUrl: branding.logoUrl || "",
      color,
      stats: [
        { value: report.rows.length, label: L("إجمالي المهام", "Total tasks") },
        { value: done, label: t("completed") },
        { value: overdue, label: t("overdue") },
        { value: report.rows.length - done - overdue, label: L("قيد التنفيذ", "In progress") },
      ],
      charts: [
        makeChart(L("تحليل حالة المهام", "Task status analysis"), countBy((task) => statusLabel(task.status))),
        makeChart(L("تحليل الأولويات", "Priority analysis"), countBy((task) => ({ urgent: t("urgent"), high: t("high"), medium: t("medium"), low: t("low") })[task.priority] || task.priority)),
        makeChart(L("المهام حسب المحطة", "Tasks by station"), countBy((task) => stationName(task.assignment_type === "hq_team" ? firstStationId : (task.station_id || task.assignment_id)))),
      ],
      sections: [{ heading: L("تفاصيل المهام", "Task details"), headers, rows: report.rows.map(toRow) }],
      theme: "executiveGold",
    });
  };

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <CalendarRange className="w-3.5 h-3.5" /> {L("تقرير المهام حسب الفترة", "Tasks report by period")}
      </p>
      {/* اختيار المحطة — تقرير مستقل لكل محطة أو تقرير شامل */}
      <MobileSelect value={stationFilter} onChange={setStationFilter} searchable searchPlaceholder={L("ابحث عن محطة...", "Search stations...")} placeholder={L("كل المحطات", "All stations")} className="w-full sm:w-72" options={[{ value: "all", label: L("كل المحطات", "All stations") }, ...(data?.stations || []).map((station) => ({ value: station.id, label: station.location ? `${station.name} — ${station.location}` : station.name }))]} />

      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ val }) => (
          <button
            key={val}
            type="button"
            onClick={() => setPreset(val)}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${preset === val ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {presetLabel(val)}
          </button>
        ))}
      </div>

      {preset === "days" && (
        <input
          type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)}
          placeholder={L("عدد الأيام الماضية", "Number of past days")}
          className="w-full sm:w-56 px-3 py-2 rounded-md border border-input text-sm font-body"
        />
      )}

      {preset === "range" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-body block mb-1">{t("startDate")}</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-body block mb-1">{t("endDate")}</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button" onClick={exportExcel}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-emerald-300 text-emerald-700 text-xs font-body hover:bg-emerald-50 transition"
        >
          <FileSpreadsheet className="w-4 h-4" /> Excel
        </button>
        <button
          type="button" onClick={exportPdf}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-border text-xs font-body hover:bg-muted transition"
        >
          <FileText className="w-4 h-4" /> PDF
        </button>
      </div>
    </div>
  );
}