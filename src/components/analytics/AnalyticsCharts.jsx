import React from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tooltipStyle = { background: "#0B1220", border: "1px solid #00E5FF", borderRadius: 10, color: "#F8FAFC" };
const axisTick = { fill: "#7C879A", fontSize: 11 };

export default function AnalyticsCharts({ categories, months, labels }) {
  return (
    <div dir="ltr" className="grid gap-7 lg:grid-cols-2">
      <div className="holo-chart rounded-2xl p-5">
        <p className="mb-4 text-end text-base font-medium text-white">{labels.distribution}</p>
        <ResponsiveContainer width="100%" height={220}><BarChart data={categories} barCategoryGap="55%"><CartesianGrid stroke="#263244" vertical={false} /><XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" fill="#22F53F" radius={[7, 7, 0, 0]} /></BarChart></ResponsiveContainer>
      </div>
      <div className="holo-chart rounded-2xl p-5">
        <p className="mb-4 text-end text-base font-medium text-white">{labels.trend}</p>
        <ResponsiveContainer width="100%" height={220}><AreaChart data={months}><defs><linearGradient id="holoArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22F53F" stopOpacity={0.5} /><stop offset="100%" stopColor="#22F53F" stopOpacity={0.03} /></linearGradient></defs><CartesianGrid stroke="#263244" vertical={false} /><XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Area type="linear" dataKey="value" stroke="#22F53F" strokeWidth={3} fill="url(#holoArea)" dot={{ r: 4, fill: "#22F53F", stroke: "#8BFF98", strokeWidth: 2 }} /></AreaChart></ResponsiveContainer>
      </div>
    </div>
  );
}