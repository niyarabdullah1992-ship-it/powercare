import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const axisProps = { tick: { fontSize: 10, fill: "hsl(var(--muted-foreground))" }, axisLine: false, tickLine: false };

export default function SafetyDashboardCharts({ months, hazards, lang }) {
  const ar = lang === "ar";
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Chart title={ar ? "اتجاه الحوادث — آخر 6 أشهر" : "Incident trend — last 6 months"}>
        <LineChart data={months} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" {...axisProps} /><YAxis allowDecimals={false} {...axisProps} />
          <Tooltip contentStyle={{ borderRadius: 10, borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
          <Line type="monotone" dataKey="incidents" name={ar ? "الحوادث" : "Incidents"} stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 3, fill: "hsl(var(--accent))" }} activeDot={{ r: 5 }} />
        </LineChart>
      </Chart>
      <Chart title={ar ? "المخاطر المفتوحة حسب المحطة" : "Open hazards by station"}>
        <BarChart data={hazards} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="station" {...axisProps} interval={0} tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}…` : value} />
          <YAxis allowDecimals={false} {...axisProps} /><Tooltip cursor={{ fill: "hsl(var(--muted) / .5)" }} contentStyle={{ borderRadius: 10, borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
          <Bar dataKey="hazards" name={ar ? "المخاطر" : "Hazards"} radius={[4, 4, 0, 0]}>{hazards.map((item, index) => <Cell key={item.station} fill={index % 2 ? "hsl(var(--accent) / .65)" : "hsl(var(--accent))"} />)}</Bar>
        </BarChart>
      </Chart>
    </div>
  );
}

function Chart({ title, children }) {
  return <div className="rounded-2xl border border-border bg-card p-4 shadow-sm"><h3 className="mb-4 text-start font-heading text-base font-semibold text-foreground">{title}</h3><div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div></div>;
}