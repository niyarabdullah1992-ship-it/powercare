import React from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { printAttendanceReport } from "@/lib/attendanceReportPdf";
import { exportAttendanceExcel } from "@/lib/exportAttendanceExcel";

// أزرار تصدير تقرير حضور الفريق بهوية NiroVera الكحلية/الخضراء.
export default function AttendanceReportExportButtons({ title, period, companyName, headers, rows, counts, totalHours, endDate, lang }) {
  const ar = lang === "ar";
  const disabled = !rows.length;
  const total = rows.length || 1;
  const pct = (value) => Math.round((value / total) * 100);
  const label = (key) => ({
    present: ar ? "حاضر" : "Present",
    late: ar ? "متأخر" : "Late",
    absent: ar ? "غائب" : "Absent",
    onLeave: ar ? "في إجازة" : "On leave",
    notScheduled: ar ? "غير مجدول" : "Not scheduled",
  })[key];

  const kpis = [
    { label: label("present"), value: counts.present, color: "#107949" },
    { label: label("late"), value: counts.late, color: "#B45309" },
    { label: label("absent"), value: counts.absent, color: "#B3261E" },
    { label: label("onLeave"), value: counts.onLeave, color: "#1E5F8A" },
    { label: label("notScheduled"), value: counts.notScheduled, color: "#5C6E7A" },
    { label: ar ? "إجمالي الساعات" : "Total hours", value: totalHours.toFixed(1), color: "#14274F" },
  ];
  const distribution = [
    { label: label("present"), percent: pct(counts.present), value: counts.present, color: "#107949" },
    { label: label("late"), percent: pct(counts.late), value: counts.late, color: "#B45309" },
    { label: label("absent"), percent: pct(counts.absent), value: counts.absent, color: "#B3261E" },
    { label: label("onLeave"), percent: pct(counts.onLeave), value: counts.onLeave, color: "#1E5F8A" },
    { label: label("notScheduled"), percent: pct(counts.notScheduled), value: counts.notScheduled, color: "#97A5B1" },
  ];
  const totalRow = [ar ? "الإجمالي" : "Total", "", "", "", "", totalHours.toFixed(1), `${rows.length} ${ar ? "سجلات" : "records"}`, ""];
  const dir = ar ? "rtl" : "ltr";

  const buttonClass = "flex items-center gap-1.5 px-3.5 py-2 rounded-md border text-xs font-body transition disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => exportAttendanceExcel({
          filename: `attendance-report-${endDate}`,
          title, period, headers, rows, statusIndex: 2, totalRow, dir,
          summary: [
            { value: counts.present, label: label("present") },
            { value: counts.late, label: label("late") },
            { value: totalHours.toFixed(1), label: ar ? "إجمالي ساعات العمل" : "Total work hours" },
          ],
          distribution: distribution.map((item) => ({ label: item.label, percent: item.percent, display: `${item.percent}%` })),
        })}
        className={`${buttonClass} border-emerald-300 text-emerald-700 hover:bg-emerald-50`}
      >
        <FileSpreadsheet className="w-4 h-4" /> Excel
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => printAttendanceReport({ title, period, companyName, kpis, headers, rows, statusIndex: 2, totalRow, distribution, dir })}
        className={`${buttonClass} border-border hover:bg-muted`}
      >
        <FileText className="w-4 h-4" /> PDF
      </button>
    </div>
  );
}