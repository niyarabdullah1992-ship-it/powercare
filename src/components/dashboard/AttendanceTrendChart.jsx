import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// Large WorkForce-style trend chart: two smooth lines (dark + gold) with dots.
export default function AttendanceTrendChart({ data, t }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-heading text-xl font-semibold">{t("productivityTrend")}</h3>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-body text-muted-foreground">
          {t("sixMonthsLabel")}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid hsl(var(--border))" }} />
          <Line
            type="natural"
            dataKey="completed"
            name={t("completed")}
            stroke="hsl(var(--foreground))"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: "hsl(var(--foreground))", strokeWidth: 0 }}
          />
          <Line
            type="natural"
            dataKey="pending"
            name={t("pending")}
            stroke="hsl(var(--accent))"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: "hsl(var(--accent))", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}