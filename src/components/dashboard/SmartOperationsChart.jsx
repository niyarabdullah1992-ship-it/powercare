import React from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import HolographicChartFrame from "@/components/dashboard/HolographicChartFrame";

export default function SmartOperationsChart({ data, labels }) {
  return (
    <HolographicChartFrame className="rounded-2xl">
      <div className="holo-chart rounded-2xl p-5">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid stroke="hsl(var(--landing-gold) / .18)" strokeDasharray="4 5" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "hsl(var(--landing-gold-light))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--landing-gold-light))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--primary))", color: "white", border: "1px solid hsl(var(--landing-gold))", borderRadius: 10 }} />
            <Legend wrapperStyle={{ color: "hsl(var(--landing-gold-light))", fontSize: 12 }} />
            <Line type="natural" dataKey="expenses" name={labels.expenses} stroke="hsl(var(--landing-gold-light))" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
            <Line type="natural" dataKey="complaints" name={labels.complaints} stroke="hsl(var(--landing-gold))" strokeWidth={3} strokeDasharray="10 5" dot={{ r: 4 }} activeDot={{ r: 7 }} />
            <Line type="natural" dataKey="inventory" name={labels.inventory} stroke="hsl(var(--accent))" strokeWidth={3} strokeDasharray="3 7" dot={{ r: 3 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </HolographicChartFrame>
  );
}