import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LabelList } from "recharts";

// رسم بياني ثابت (بلا حركة) ليظهر بشكل صحيح داخل ملف PDF.
export default function TruePerfChart({ chart }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="h-[320px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart.data} margin={{ top: 20, right: 12, left: 0, bottom: 8 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="metricAr" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} interval={0} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="traditional" name={chart.legendTraditionalAr} fill="hsl(var(--muted-foreground))" isAnimationActive={false} radius={[3, 3, 0, 0]} maxBarSize={26} />
            <Bar dataKey="nirovera" name={chart.legendNiroAr} fill="hsl(var(--accent))" isAnimationActive={false} radius={[3, 3, 0, 0]} maxBarSize={26}>
              <LabelList dataKey="nirovera" position="top" style={{ fontSize: 10, fill: "hsl(var(--primary))" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 border-t border-border pt-3 text-[11px] leading-5 text-muted-foreground">{chart.noteAr}</p>
    </div>
  );
}