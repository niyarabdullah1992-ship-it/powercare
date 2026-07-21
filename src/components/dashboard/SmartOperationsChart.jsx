import React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function SmartOperationsChart({ rows }) {
  return (
    <div className="holo-chart holo-float-card rounded-2xl p-5">
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={rows} barCategoryGap="55%">
          <CartesianGrid stroke="hsl(var(--holo-cyan) / .16)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "hsl(var(--holo-panel))", border: "1px solid hsl(var(--holo-cyan))", borderRadius: 10 }} />
          <Bar dataKey="value" fill="hsl(var(--holo-green))" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}