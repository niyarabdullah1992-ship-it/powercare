import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { CheckCircle2, Triangle, Square, AlertOctagon } from "lucide-react";
import StationFilterDropdown from "@/components/reports/StationFilterDropdown";
import ReportCard from "@/components/reports/ReportCard";
import ReportTableHead from "@/components/reports/ReportTableHead";

const COLOR_COMPLETED = "#10b981"; // emerald-500
const COLOR_ONTRACK = "#3b82f6"; // blue-500
const COLOR_OVERDUE = "#ef4444"; // red-500

const LEVEL_TONE = {
  green: "bg-emerald-100 text-emerald-700 border border-emerald-300",
  amber: "bg-amber-100 text-amber-700 border border-amber-300",
  red: "bg-red-100 text-red-700 border border-red-300",
};

// Overall health shape for a station, at a glance: circle = healthy, square = needs
// attention, triangle/octagon = at risk — shape + color both carry the signal.
function statusShape(c) {
  const overdueRatio = c.overdue > 0 ? c.overdue / Math.max(1, c.completed + c.overdue + c.onTrack) : 0;
  if (c.safetyLevel === "red" || overdueRatio > 0.3) {
    return { Icon: AlertOctagon, color: "text-red-600", bg: "bg-red-100", label: "high" };
  }
  if (c.overdue > 0 || c.safetyLevel === "amber") {
    return { Icon: Triangle, color: "text-amber-600", bg: "bg-amber-100", label: "medium" };
  }
  if (c.completed > 0 && c.onTrack === 0 && c.overdue === 0) {
    return { Icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100", label: "low" };
  }
  return { Icon: Square, color: "text-blue-600", bg: "bg-blue-100", label: "low" };
}

export default function StationComparison() {
  const { t } = useI18n();
  const { data, currentUser } = useAuth();
  const [selected, setSelected] = useState([]);
  const [targets, setTargets] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const res = await base44.functions.invoke("supabaseTargets", {
          action: "listTargets",
          userRole: currentUser.role,
          userId: currentUser.id,
          stationId: currentUser.stationId || null,
          managedStations: currentUser.managedStations || [],
        });
        setTargets(res?.data?.targets || []);
      } catch {
        setTargets([]);
      }
    })();
  }, [currentUser?.id]);

  if (!data) return null;

  const empStation = (id) => data.employees.find((e) => e.id === id)?.stationId || null;
  const targetStationKey = (tg) => {
    if (tg.assignment_type === "station_team") return tg.assignment_id || tg.station_id || null;
    if (tg.assignment_type === "member") return tg.station_id || empStation(tg.employee_id) || null;
    return tg.station_id || null;
  };

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const metricsFor = (station) => {
    const members = data.employees.filter((e) => e.stationId === station.id);
    const stationTargets = targets.filter((tg) => targetStationKey(tg) === station.id);
    const completed = stationTargets.filter((tg) => tg.status === "completed").length;
    const overdue = stationTargets.filter((tg) => tg.status === "overdue").length;
    const onTrack = stationTargets.length - completed - overdue;
    const points = members.reduce((sum, e) => sum + (e.points || 0), 0);
    const safety = data.safety.find((s) => s.stationId === station.id) || { level: "green", incidents: 0 };
    return {
      id: station.id,
      name: station.name,
      team: members.length,
      completed,
      overdue,
      onTrack,
      points,
      safetyLevel: safety.level,
      incidents: safety.incidents || 0,
    };
  };

  const compared = selected.map((id) => metricsFor(data.stations.find((s) => s.id === id))).filter(Boolean);
  const chartData = compared.map((c) => ({
    name: c.name,
    [t("completed")]: c.completed,
    [t("overdue")]: c.overdue,
    [t("inProgress")]: c.onTrack,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground font-body">{t("compareStationsNote")}</p>
        <StationFilterDropdown
          t={t}
          options={data.stations.map((s) => ({ key: s.id, label: s.name }))}
          selected={selected}
          onToggle={toggle}
          onSelectAll={() => setSelected(data.stations.map((s) => s.id))}
          onClearAll={() => setSelected([])}
        />
      </div>

      {selected.length < 2 ? (
        <p className="text-sm text-muted-foreground font-body p-6 text-center border border-border rounded-xl bg-card">{t("selectAtLeastTwo")}</p>
      ) : (
        <>
          {/* At-a-glance status shapes — color + geometry both signal station health */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {compared.map((c) => {
              const { Icon, color, bg, label } = statusShape(c);
              return (
                <div key={c.id} className="group p-4 rounded-xl border border-border bg-card flex items-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${bg} ring-4 ring-white/40 shadow-inner`}>
                    <Icon className={`w-5 h-5 ${color}`} strokeWidth={2.25} fill="currentColor" fillOpacity={0.15} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium font-body truncate">{c.name}</p>
                    <p className={`text-xs font-body font-medium ${color}`}>
                      {label === "high" ? t("high") : label === "medium" ? t("medium") : t("low")} · {c.overdue} {t("overdue").toLowerCase()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tasks: completed / overdue / on track — per station */}
          <ReportCard title={`${t("completed")} · ${t("overdue")} · ${t("inProgress")}`}>
            <div className="w-full h-80" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={8} barCategoryGap="28%">
                  <defs>
                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLOR_COMPLETED} stopOpacity={1} />
                      <stop offset="100%" stopColor={COLOR_COMPLETED} stopOpacity={0.65} />
                    </linearGradient>
                    <linearGradient id="gradOnTrack" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLOR_ONTRACK} stopOpacity={1} />
                      <stop offset="100%" stopColor={COLOR_ONTRACK} stopOpacity={0.65} />
                    </linearGradient>
                    <linearGradient id="gradOverdue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLOR_OVERDUE} stopOpacity={1} />
                      <stop offset="100%" stopColor={COLOR_OVERDUE} stopOpacity={0.65} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} iconType="circle" />
                  <Bar dataKey={t("completed")} stackId="tasks" fill="url(#gradCompleted)" radius={[0, 0, 0, 0]} maxBarSize={56} />
                  <Bar dataKey={t("inProgress")} stackId="tasks" fill="url(#gradOnTrack)" radius={[0, 0, 0, 0]} maxBarSize={56} />
                  <Bar dataKey={t("overdue")} stackId="tasks" fill="url(#gradOverdue)" radius={[8, 8, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ReportCard>

          {/* Comparison table */}
          <ReportCard className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <ReportTableHead columns={[t("stations"), t("team"), t("completed"), t("inProgress"), t("overdue"), t("points"), t("safetyLevel"), t("incidents")]} />
              <tbody>
                {compared.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 px-2 font-medium">{c.name}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{c.team}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{c.completed}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{c.onTrack}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{c.overdue}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{c.points}</td>
                    <td className="py-2.5 px-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${LEVEL_TONE[c.safetyLevel] || LEVEL_TONE.green}`}>
                        {c.safetyLevel === "red" ? <AlertOctagon className="w-3 h-3" /> : c.safetyLevel === "amber" ? <Triangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {t(c.safetyLevel === "red" ? "high" : c.safetyLevel === "amber" ? "medium" : "low")}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-muted-foreground">{c.incidents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ReportCard>
        </>
      )}
    </div>
  );
}