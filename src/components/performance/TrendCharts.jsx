import React from "react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { chartTooltip, WARNING_COLOR } from "@/lib/trendFormat";

const axisProps = { stroke: "hsl(var(--muted-foreground))", fontSize: 10, tickLine: false, axisLine: false };

function ChartCard({ title, empty, children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-body">{title}</p>
      {empty ? (
        <p className="py-10 text-center text-xs text-muted-foreground font-body">—</p>
      ) : (
        <div className="h-48 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// Three trends side by side — one screen, not three.
export default function TrendCharts({ weightRows, attendanceRows, lateRows, labels }) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <ChartCard title={labels.weight} empty={!weightRows.length}>
        <AreaChart data={weightRows} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="trendWeight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...axisProps} allowDecimals={false} />
          <Tooltip {...chartTooltip} />
          <Area type="monotone" dataKey="total" name={labels.weight} stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#trendWeight)" />
        </AreaChart>
      </ChartCard>

      <ChartCard title={labels.attendance} empty={!attendanceRows.length}>
        <LineChart data={attendanceRows} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...axisProps} domain={[0, 100]} unit="%" />
          <Tooltip {...chartTooltip} />
          <Line type="monotone" dataKey="avgRate" name={labels.attendance} stroke="hsl(var(--chart-3))" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ChartCard>

      <ChartCard title={labels.late} empty={!lateRows.length}>
        <BarChart data={lateRows} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...axisProps} allowDecimals={false} />
          <Tooltip {...chartTooltip} cursor={{ fill: "transparent" }} />
          <Bar dataKey="lateCount" name={labels.late} fill={WARNING_COLOR} radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ChartCard>
    </div>
  );
}