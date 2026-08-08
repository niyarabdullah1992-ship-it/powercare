import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// مقارنة بصرية بين مكوّنات التكلفة للفترة المختارة.
export default function FinanceMixChart({ data, lang }) {
  const ar = lang === "ar";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-heading text-base font-semibold mb-3">{ar ? "مكوّنات التكلفة" : "Cost breakdown"}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip cursor={{ fill: "hsl(var(--accent) / .08)" }} />
            <Bar dataKey="value" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={64} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}