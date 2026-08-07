import React from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { formatDate } from "@/lib/dateFormat";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import ExportItemCard from "./ExportItemCard";
import { ListTodo, CalendarDays, Users, Building2, Trophy, GraduationCap, Download } from "lucide-react";

// Download Center: every report across all sections, exportable as branded
// colored Excel or PDF using the company's logo and brand color.
export default function ExportCenter({ targets = [] }) {
  const { t, dir, lang } = useI18n();
  const { data, company } = useAuth();
  if (!data) return null;

  const ar = lang === "ar";
  const color = data.reportBranding?.color || "#b07d3f";
  const logoUrl = data.reportBranding?.logoUrl || "";
  const companyName = data.name || company?.name || "";

  const defaultStationId = data.stations?.[0]?.id || null;
  const stationName = (id) => data.stations.find((s) => s.id === (id || defaultStationId))?.name || "—";
  const employeeName = (id) => data.employees.find((e) => e.id === id)?.name || "—";
  const statusLabel = (s) => (s === "completed" ? t("completed") : s === "overdue" ? t("overdue") : t("inProgress"));

  const leaves = data.employees.flatMap((e) => (e.leaveRequests || []).map((r) => ({ ...r, empId: e.id, stId: e.stationId })));
  const certs = data.employees.flatMap((e) => (e.certificates || []).map((c) => ({ ...c, empId: e.id })));
  const ranked = [...data.employees].sort((a, b) => (b.points || 0) - (a.points || 0));

  const datasets = [
    {
      key: "tasks-report", icon: ListTodo, title: ar ? "تقرير المهام" : "Tasks report", count: targets.length,
      headers: [t("title"), t("station"), t("status"), t("taskCompletion"), t("priority"), t("startDate"), t("endDate")],
      rows: targets.map((tg) => [tg.title || "—", stationName(tg.assignment_type === "hq_team" ? defaultStationId : tg.station_id), statusLabel(tg.status), `${tg.completed_tasks}/${tg.task_target}`, t(tg.priority), formatDate(tg.start_date, lang), formatDate(tg.end_date, lang)]),
    },
    {
      key: "leaves-report", icon: CalendarDays, title: t("leaveRequests"), count: leaves.length,
      headers: [t("employeeName"), t("station"), t("leaveType"), t("startDate"), t("endDate"), t("days"), t("status")],
      rows: leaves.map((r) => [employeeName(r.empId), stationName(r.stId), t(r.type), formatDate(r.startDate, lang), formatDate(r.endDate, lang), r.days, t(r.status)]),
    },
    {
      key: "employees-report", icon: Users, title: ar ? "تقرير الموظفين" : "Employees report", count: data.employees.length,
      headers: [t("employeeName"), ar ? "المنصب" : "Position", t("station"), ar ? "البريد" : "Email", ar ? "الهاتف" : "Phone", ar ? "النقاط" : "Points"],
      rows: data.employees.map((e) => [e.name, e.position || e.role, stationName(e.stationId), e.email || "—", e.phone || "—", e.points || 0]),
    },
    {
      key: "stations-report", icon: Building2, title: ar ? "تقرير المحطات" : "Stations report", count: data.stations.length,
      headers: [ar ? "المحطة" : "Station", ar ? "الموقع" : "Location", ar ? "النوع" : "Type", t("status"), ar ? "المدير" : "Manager", ar ? "عدد الموظفين" : "Employees"],
      rows: data.stations.map((s) => [s.name, s.location || "—", s.type || "—", s.status || "—", s.managerId ? employeeName(s.managerId) : "—", data.employees.filter((e) => (e.stationId || defaultStationId) === s.id).length]),
    },
    {
      key: "performance-report", icon: Trophy, title: ar ? "تقرير الأداء والنقاط" : "Performance & points report", count: ranked.length,
      headers: ["#", t("employeeName"), t("station"), ar ? "النقاط" : "Points"],
      rows: ranked.map((e, i) => [i + 1, e.name, stationName(e.stationId), e.points || 0]),
    },
    {
      key: "certificates-report", icon: GraduationCap, title: ar ? "تقرير الشهادات" : "Certificates report", count: certs.length,
      headers: [t("employeeName"), ar ? "الشهادة" : "Certificate", ar ? "الفئة" : "Category", ar ? "التاريخ" : "Date"],
      rows: certs.map((c) => [employeeName(c.empId), c.name || c.title || "—", c.category || "—", c.date || c.issueDate ? formatDate(c.date || c.issueDate, lang) : "—"]),
    },
  ];

  const doExcel = (d) => exportExcelColored({ filename: d.key, title: `${d.title} — ${companyName}`, headers: d.headers, rows: d.rows, color, dir });
  const doPdf = (d) => printReport({ title: d.title, companyName, dir, sections: [{ heading: d.title, headers: d.headers, rows: d.rows }], logoUrl, color });
  const downloadAll = () =>
    printReport({
      title: ar ? "التقرير الشامل للشركة" : "Full company report",
      companyName, dir, logoUrl, color,
      stats: datasets.map((d) => ({ label: d.title, value: d.count })),
      sections: datasets.map((d) => ({ heading: d.title, headers: d.headers, rows: d.rows })),
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground font-body">
          {ar
            ? "جميع التقارير تُنزَّل بشعار الشركة ولونها المعتمدين في إعدادات هوية التقارير."
            : "Every report downloads with your company logo and brand color from the report branding settings."}
        </p>
        <button
          onClick={downloadAll}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-body text-white"
          style={{ background: color }}
        >
          <Download className="w-3.5 h-3.5" /> {ar ? "تنزيل التقرير الشامل (PDF)" : "Download full report (PDF)"}
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {datasets.map((d) => (
          <ExportItemCard key={d.key} icon={d.icon} title={d.title} count={d.count} color={color} ar={ar} onExcel={() => doExcel(d)} onPdf={() => doPdf(d)} />
        ))}
      </div>
    </div>
  );
}