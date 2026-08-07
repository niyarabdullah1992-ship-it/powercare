import React from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#2f8f83", "#e0a43b", "#c74f4f", "#55768f", "#9aa5af"];

export default function AttendanceDailyCharts({ counts, totalHours, lang }) {
  const labels = lang === "ar"
    ? ["حاضر", "متأخر", "غائب", "في إجازة", "غير مجدول"]
    : ["Present", "Late", "Absent", "On leave", "Not scheduled"];
  const values = [counts.present, counts.late, counts.absent, counts.onLeave, counts.notScheduled];
  const data = labels.map((name, index) => ({ name, value: values[index], color: COLORS[index] }));
  const total = values.reduce((sum, value) => sum + value, 0);
  return (
    <section className="mt-5 border-t border-border pt-5">
      <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-accent">{lang === "ar" ? "التحليل التشغيلي" : "Operational analytics"}</p><h4 className="font-heading text-lg font-semibold">{lang === "ar" ? "تحليل الحضور اليومي" : "Daily attendance analysis"}</h4></div><p className="text-xs text-muted-foreground">{lang === "ar" ? `إجمالي ساعات العمل: ${totalHours.toFixed(1)}` : `Total work hours: ${totalHours.toFixed(1)}`}</p></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-border bg-secondary/30 p-3"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={86} paddingAngle={3}>{data.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /><text x="50%" y="48%" textAnchor="middle" className="fill-foreground text-2xl font-semibold">{total}</text><text x="50%" y="58%" textAnchor="middle" className="fill-muted-foreground text-[10px]">{lang === "ar" ? "موظف" : "Employees"}</text></PieChart></ResponsiveContainer></div>
        <div className="h-64 rounded-xl border border-border bg-secondary/30 p-3"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 10 }}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" radius={[5, 5, 0, 0]}>{data.map((item) => <Cell key={item.name} fill={item.color} />)}</Bar></BarChart></ResponsiveContainer></div>
      </div>
    </section>
  );
}