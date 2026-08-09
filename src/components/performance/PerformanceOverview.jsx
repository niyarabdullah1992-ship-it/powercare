import React from "react";
import { Users } from "lucide-react";
import { badgeFor, getBadges } from "@/lib/rewards";
import BadgeMark from "@/components/performance/BadgeMark";
import PerformanceEmptyState from "@/components/performance/PerformanceEmptyState";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";

// Starting screen: three KPIs, unit ranking by earned effort, and the top ten people.
export default function PerformanceOverview({ t, ar, company, ranked, stationTotals, stationName, roleLabel, currentUserId, onSelectEmployee }) {
  const badges = getBadges(company);
  const totalPoints = ranked.reduce((sum, e) => sum + e.points, 0);
  const contributors = ranked.filter((e) => e.points > 0).length;
  const topUnit = stationTotals[0];

  if (totalPoints === 0) return <PerformanceEmptyState ar={ar} />;

  const kpis = [
    { label: ar ? "إجمالي النقاط" : "Total points", value: totalPoints },
    { label: ar ? "موظفون لهم إنجاز" : "Contributing employees", value: contributors },
    { label: ar ? "الوحدة الأعلى" : "Top unit", value: topUnit?.name || "—" },
  ];

  const top10 = ranked.slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-body">{kpi.label}</p>
            <p className="mt-1 truncate font-heading text-xl font-semibold">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <ComparisonExportButtons
          title={t("stationRanking")}
          headers={["#", t("stations"), t("members"), t("points")]}
          rows={stationTotals.map((s, i) => [i + 1, s.name, s.memberCount, s.points])}
        />
      </div>

      <section className="space-y-2">
        <h2 className="font-heading text-base font-semibold">{t("stationRanking")}</h2>
        {stationTotals.map((team, i) => (
          <div key={team.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <span className="w-6 shrink-0 text-center text-xs text-muted-foreground">{i + 1}</span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-foreground/5"><Users className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium font-body">{team.name}</p>
              <p className="text-xs text-muted-foreground font-body">{team.memberCount} {t("members")}</p>
            </div>
            <p className="shrink-0 font-heading text-lg font-semibold">
              {team.points} <span className="text-xs text-muted-foreground font-body">{t("points")}</span>
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-base font-semibold">{ar ? "أعلى عشرة موظفين" : "Top ten employees"}</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {top10.map((e, i) => {
            const level = badges.findIndex((b) => b.key === badgeFor(e.points, badges).key);
            return (
              <button
                key={e.id}
                onClick={() => onSelectEmployee(e.id)}
                className={`flex w-full items-center gap-3 border-b border-border p-3 text-start last:border-b-0 hover:bg-muted ${e.id === currentUserId ? "bg-accent/5" : ""}`}
              >
                <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{i + 1}</span>
                <BadgeMark level={level} title={t(badges[level]?.key)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium font-body">{e.name}</span>
                  <span className="block truncate text-xs text-muted-foreground font-body">
                    {roleLabel(e)} · {stationName(e.stationId)}
                  </span>
                </span>
                <span className="shrink-0 font-heading text-base font-semibold">{e.points}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}