import React from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

export default function SmartSeriesLine({ data, dataKey, label, color }) {
  const current = Number(data.at(-1)?.[dataKey] || 0);
  const previous = Number(data.at(-2)?.[dataKey] || 0);
  const TrendIcon = current > previous ? TrendingUp : current < previous ? TrendingDown : Minus;
  return (
    <div className="rounded-xl border border-landing-gold/25 bg-black/10 p-3">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-xs text-white/75">{label}</span>
        <span className="flex items-center gap-1 text-sm font-semibold text-landing-gold-light"><TrendIcon className="h-4 w-4" />{current}</span>
      </div>
      <ResponsiveContainer width="100%" height={82}>
        <LineChart data={data}>
          <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.month || ""} contentStyle={{ background: "hsl(var(--primary))", color: "white", border: "1px solid hsl(var(--landing-gold))", borderRadius: 10 }} />
          <Line type="natural" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ r: 3, fill: color }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-[10px] text-white/35"><span>{data[0]?.month}</span><span>{data.at(-1)?.month}</span></div>
    </div>
  );
}