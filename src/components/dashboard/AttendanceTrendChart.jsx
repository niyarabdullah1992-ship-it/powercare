import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import HolographicChartFrame from "@/components/dashboard/HolographicChartFrame";

// Interactive holographic trend chart for the command dashboard.
export default function AttendanceTrendChart({ data, t }) {
  return (
    <HolographicChartFrame className="rounded-2xl">
    <div className="holo-chart rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-heading text-xl font-semibold text-white">{t("productivityTrend")}</h3>
        <span className="rounded-full border border-landing-gold/40 px-3 py-1 text-xs font-body text-landing-gold-light">
          {t("sixMonthsLabel")}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--landing-gold) / .18)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "hsl(var(--primary))", color: "white", borderRadius: 10, fontSize: 12, border: "1px solid hsl(var(--landing-gold))" }} />
          <Line
            type="natural"
            dataKey="completed"
            name={t("completed")}
            stroke="hsl(var(--landing-gold-light))"
            strokeWidth={3}
            dot={{ r: 4, fill: "hsl(var(--landing-gold-light))", stroke: "hsl(var(--landing-gold))", strokeWidth: 2 }}
          />
          <Line
            type="natural"
            dataKey="pending"
            name={t("pending")}
            stroke="hsl(var(--accent))"
            strokeWidth={2.5}
            strokeDasharray="7 5"
            dot={{ r: 3.5, fill: "hsl(var(--accent))", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
    </HolographicChartFrame>
  );
}