import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Building2, Check } from "lucide-react";

const LEVEL_TONE = {
  green: "bg-accent/15 text-accent",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-destructive/15 text-destructive",
};

export default function StationComparison() {
  const { t } = useI18n();
  const { data } = useAuth();
  const [selected, setSelected] = useState([]);

  if (!data) return null;

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const metricsFor = (station) => {
    const members = data.employees.filter((e) => e.stationId === station.id);
    const tasks = data.tasks.filter((tk) => tk.stationId === station.id);
    const completed = tasks.filter((tk) => tk.status === "completed").length;
    const active = tasks.filter((tk) => tk.status === "in_progress" || tk.status === "pending").length;
    const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const points = members.reduce((sum, e) => sum + (e.points || 0), 0);
    const safety = data.safety.find((s) => s.stationId === station.id) || { level: "green", incidents: 0 };
    return {
      id: station.id,
      name: station.name,
      team: members.length,
      completionRate,
      active,
      points,
      safetyLevel: safety.level,
      incidents: safety.incidents || 0,
    };
  };

  const compared = selected.map((id) => metricsFor(data.stations.find((s) => s.id === id))).filter(Boolean);
  const chartData = compared.map((c) => ({ name: c.name, [t("taskCompletion")]: c.completionRate, [t("points")]: c.points }));

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground font-body">{t("compareStationsNote")}</p>

      {/* Station picker */}
      <div className="flex flex-wrap gap-2">
        {data.stations.map((s) => {
          const isSelected = selected.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${isSelected ? "bg-accent text-accent-foreground border-accent" : "border-border hover:bg-muted"}`}
            >
              {isSelected && <Check className="w-3 h-3" />}
              <Building2 className="w-3.5 h-3.5" /> {s.name}
            </button>
          );
        })}
      </div>

      {selected.length < 2 ? (
        <p className="text-sm text-muted-foreground font-body p-6 text-center border border-border rounded-xl bg-card">{t("selectAtLeastTwo")}</p>
      ) : (
        <>
          {/* Comparison table */}
          <div className="p-4 rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="py-2 px-2 text-start">{t("stations")}</th>
                  <th className="py-2 px-2 text-start">{t("team")}</th>
                  <th className="py-2 px-2 text-start">{t("taskCompletion")}</th>
                  <th className="py-2 px-2 text-start">{t("activeTasksCount")}</th>
                  <th className="py-2 px-2 text-start">{t("points")}</th>
                  <th className="py-2 px-2 text-start">{t("safetyLevel")}</th>
                  <th className="py-2 px-2 text-start">{t("incidents")}</th>
                </tr>
              </thead>
              <tbody>
                {compared.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 px-2 font-medium">{c.name}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{c.team}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{c.completionRate}%</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{c.active}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{c.points}</td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${LEVEL_TONE[c.safetyLevel] || LEVEL_TONE.green}`}>{t(c.safetyLevel === "red" ? "high" : c.safetyLevel === "amber" ? "medium" : "low")}</span>
                    </td>
                    <td className="py-2.5 px-2 text-muted-foreground">{c.incidents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bar chart comparison */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-heading text-base font-semibold mb-4">{t("taskCompletion")} · {t("points")}</h3>
            <div className="w-full h-72" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey={t("taskCompletion")} fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={t("points")} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}