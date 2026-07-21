import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["hsl(var(--chart-4))", "hsl(var(--accent))", "hsl(var(--chart-2))", "hsl(var(--chart-1))", "hsl(var(--chart-3))", "hsl(var(--chart-5))"];
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))" };

export default function AnalyticsCharts({ categories, months, labels }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="analytics-chart rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="mb-2 text-xs font-medium text-white/70">{labels.distribution}</p>
        <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>{categories.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer>
      </div>
      <div className="analytics-chart rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="mb-2 text-xs font-medium text-white/70">{labels.trend}</p>
        <ResponsiveContainer width="100%" height={220}><BarChart data={months}><CartesianGrid stroke="hsl(var(--landing-gold) / .12)" vertical={false} /><XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,.55)", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" fill="hsl(var(--landing-gold))" radius={[7, 7, 0, 0]} /></BarChart></ResponsiveContainer>
      </div>
    </div>
  );
}