import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const axisProps = { tick: { fontSize: 10, fill: "#61452f" }, axisLine: false, tickLine: false };

export default function SafetyDashboardCharts({ months, hazards, lang }) {
  const ar = lang === "ar";
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Chart title={ar ? "اتجاه الحوادث — آخر 6 أشهر" : "Incident trend — last 6 months"}>
        <LineChart data={months} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#d8c8aa" vertical={false} />
          <XAxis dataKey="month" {...axisProps} /><YAxis allowDecimals={false} {...axisProps} />
          <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#d4b97f", background: "#fffaf0" }} />
          <Line type="monotone" dataKey="incidents" name={ar ? "الحوادث" : "Incidents"} stroke="#b58a3d" strokeWidth={3} dot={{ r: 3, fill: "#8b4a12" }} activeDot={{ r: 5 }} />
        </LineChart>
      </Chart>
      <Chart title={ar ? "المخاطر المفتوحة حسب المحطة" : "Open hazards by station"}>
        <BarChart data={hazards} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#d8c8aa" vertical={false} />
          <XAxis dataKey="station" {...axisProps} interval={0} tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}…` : value} />
          <YAxis allowDecimals={false} {...axisProps} /><Tooltip cursor={{ fill: "rgba(181,138,61,.12)" }} contentStyle={{ borderRadius: 10, borderColor: "#d4b97f", background: "#fffaf0" }} />
          <Bar dataKey="hazards" name={ar ? "المخاطر" : "Hazards"} radius={[4, 4, 0, 0]}>{hazards.map((item, index) => <Cell key={item.station} fill={index % 2 ? "#c5a25d" : "#8b4a12"} />)}</Bar>
        </BarChart>
      </Chart>
    </div>
  );
}

function Chart({ title, children }) {
  return <div className="rounded-xl border border-white/80 bg-[#f8f3e8]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.8)]"><h3 className="mb-4 text-end text-sm font-semibold text-[#34251a]">{title}</h3><div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div></div>;
}