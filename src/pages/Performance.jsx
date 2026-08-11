import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { badgeFor, getBadges } from "@/lib/rewards";
import { getRoleLabel } from "@/lib/roles";
import { Trophy, Medal, Crown, Users, Award } from "lucide-react";
import PerformanceAnalytics from "@/components/performance/PerformanceAnalytics";
import MonthlyTrends from "@/components/performance/MonthlyTrends";
import BadgeLegend from "@/components/performance/BadgeLegend";
import StationComparison from "@/components/performance/StationComparison";
import EmployeeComparisonView from "@/components/performance/EmployeeComparisonView";
import EmployeeSingleReport from "@/components/performance/EmployeeSingleReport";
import SupervisionFairness from "@/components/performance/SupervisionFairness";
import PerformanceTabs from "@/components/performance/PerformanceTabs";
import PerformanceHeaderStats from "@/components/performance/PerformanceHeaderStats";
import OpsPointsLedger from "@/components/performance/OpsPointsLedger";
import PerfScoreBoard from "@/components/performance/PerfScoreBoard";
import usePerformanceTargets from "@/hooks/usePerformanceTargets";
import { buildSupervisionModel } from "@/lib/supervisionModel";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";
import { syncPointsFromCloud } from "@/lib/store";

export default function Performance() {
  const { t, dir, lang } = useI18n();
  const { data, currentUser, company, refresh } = useAuth();
  // The achievements board replaced the older individual-ranking list (same data,
  // same export) — the old "individual" value still resolves to it.
  const [view, setView] = useState("achievements");
  const targets = usePerformanceTargets(company, currentUser);

  useEffect(() => {
    if (!company?.id) return;
    syncPointsFromCloud(company.id).then((ok) => { if (ok) refresh?.(); }).catch(() => {});
  }, [company?.id]);

  if (!data || !currentUser) return null;

  const scopedTargets = targets || [];
  const approvedEvidence = scopedTargets.filter(
    (tg) => tg.status === "completed" && Array.isArray(tg.completion_proof) && tg.completion_proof.length > 0
  ).length;
  const completedCount = scopedTargets.filter((tg) => tg.status === "completed").length;
  const overallPct = scopedTargets.length ? Math.round((completedCount / scopedTargets.length) * 100) : 0;
  const periodLabel = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en", { month: "long", year: "numeric" }).format(new Date());
  const supervisionModel = buildSupervisionModel(scopedTargets, data);
  const supervisionAlert = supervisionModel.supervisors.some(
    (s) => s.rejections >= 3 && s.rejectionRate > Math.max(supervisionModel.peerAvgRejection * 1.5, 0.25)
  );

  const badges = getBadges(company);
  const defaultStationId = data.stations?.[0]?.id || null;
  const stationName = (id) => data.stations.find((s) => s.id === (id || defaultStationId))?.name || "—";
  const roleLabel = (e) => e.customTitle || getRoleLabel(company, e.role, t);

  // Regular employees see only their own station's team — so every member can
  // compare achievements with their direct colleagues. Managers see everyone.
  const isManager = currentUser.role !== "employee";
  const scopedEmployees = isManager
    ? data.employees
    : data.employees.filter((e) => (e.stationId || defaultStationId) === (currentUser.stationId || defaultStationId));

  const ranked = [...scopedEmployees]
    .map((e) => ({ ...e, points: e.points || 0 }))
    .sort((a, b) => b.points - a.points);

  const stationTotals = data.stations
    .map((s) => {
      const members = data.employees.filter((e) => (e.stationId || defaultStationId) === s.id);
      const total = members.reduce((sum, e) => sum + (e.points || 0), 0);
      return { ...s, points: total, memberCount: members.length };
    })
    .sort((a, b) => b.points - a.points);


  const rankIcon = (i) =>
    i === 0 ? <Crown className="w-4 h-4 text-yellow-500" /> :
    i === 1 ? <Medal className="w-4 h-4 text-gray-400" /> :
    i === 2 ? <Medal className="w-4 h-4 text-amber-600" /> :
    <span className="text-xs text-muted-foreground">{i + 1}</span>;

  return (
    <div className="performance-hub space-y-6">
      <div className="performance-hub-header flex items-center justify-between flex-wrap gap-5">
        <div className="performance-hub-title">
          <h1 className="font-heading text-3xl font-semibold flex items-center gap-2">
            <Trophy className="w-6 h-6" /> {t("performance")}
          </h1>
          {!isManager && (
            <p className="text-sm text-muted-foreground font-body mt-1">
              {t("myStation")}: {stationName(currentUser.stationId || defaultStationId)}
            </p>
          )}
          <PerformanceHeaderStats
            items={[
              { label: lang === "ar" ? "نسبة الأداء العامة" : "Overall performance", value: `${overallPct}%` },
              { label: lang === "ar" ? "الفترة" : "Period", value: periodLabel },
              { label: lang === "ar" ? "الأدلة المعتمدة" : "Approved evidence", value: approvedEvidence },
            ]}
          />
        </div>
        <PerformanceTabs
          view={view}
          setView={setView}
          isManager={isManager}
          t={t}
          lang={lang}
          supervisionAlert={supervisionAlert}
        />
      </div>

      <OpsPointsLedger
        companyId={company?.id}
        employeeId={isManager ? null : currentUser.id}
        lang={lang}
      />

      <PerfScoreBoard lang={lang} />

      {(view === "individual" || view === "achievements") && (
        <div className="flex justify-end">
          <ComparisonExportButtons
            title={t("achievementsBoard")}
            headers={["#", t("employeeName"), t("station"), t("points")]}
            rows={ranked.map((e, i) => [i + 1, e.name, stationName(e.stationId || defaultStationId), e.points])}
          />
        </div>
      )}
      {view === "station" && (
        <div className="flex justify-end">
          <ComparisonExportButtons
            title={t("stationRanking")}
            headers={["#", t("stations"), t("members"), t("points")]}
            rows={stationTotals.map((s, i) => [i + 1, s.name, s.memberCount, s.points])}
          />
        </div>
      )}

      {view === "comparison" && <StationComparison />}
      {view === "employeeComparison" && <EmployeeComparisonView t={t} />}
      {view === "individualReport" && <EmployeeSingleReport t={t} />}

      {/* Badge tiers legend — irrelevant in analytics, which opens with the stoppage issues list. */}
      {view !== "comparison" && view !== "employeeComparison" && view !== "individualReport" && view !== "trends" && view !== "supervision" && view !== "analytics" && <BadgeLegend />}

      {view === "station" && (
        <div className="space-y-5">
          {/* Podium for top 3 */}
          {(() => {
            const all = stationTotals.map((s) => ({ key: s.id, name: s.name, points: s.points, memberCount: s.memberCount })).filter((x) => x.memberCount > 0 || x.points > 0)
              .sort((a, b) => b.points - a.points);
            const top3 = all.slice(0, 3);
            const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
            const heights = ["h-24", "h-32", "h-20"];
            const medalColors = ["text-gray-400", "text-yellow-500", "text-amber-600"];
            if (all.every((x) => x.points === 0)) return null;
            return (
              <div className="flex items-end justify-center gap-3">
                {podiumOrder.map((team, idx) => {
                  const realRank = all.findIndex((x) => x.key === team.key);
                  const podiumIdx = realRank === 0 ? 1 : realRank === 1 ? 0 : 2;
                  return (
                    <div key={team.key} className="flex flex-col items-center gap-1.5 w-28">
                      <div className="relative">
                        {realRank === 0 && <Crown className="w-5 h-5 text-yellow-500 absolute -top-5 left-1/2 -translate-x-1/2" />}
                        <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-medium">
                          {team.name.charAt(0)}
                        </div>
                        <span className={`absolute -bottom-1 -end-1 text-base ${medalColors[realRank]}`}>
                          {realRank === 0 ? "🥇" : realRank === 1 ? "🥈" : "🥉"}
                        </span>
                      </div>
                      <p className="text-xs font-medium font-body text-center truncate w-full">{team.name}</p>
                      <p className="text-sm font-heading font-semibold">{team.points}</p>
                      <div className={`w-full rounded-t-lg bg-gradient-to-t ${realRank === 0 ? "from-yellow-500/30 to-yellow-500/10" : realRank === 1 ? "from-gray-400/30 to-gray-400/10" : "from-amber-600/30 to-amber-600/10"} ${heights[podiumIdx]} flex items-start justify-center pt-2`}>
                        <span className="text-xs font-heading font-bold text-muted-foreground">#{realRank + 1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Full leaderboard */}
          <div className="space-y-2">
            {(() => {
              const all = stationTotals.map((s) => ({ key: s.id, name: s.name, points: s.points, memberCount: s.memberCount })).sort((a, b) => b.points - a.points);
              return all.map((team, i) => (
                <div
                  key={team.key}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                >
                  <div className="w-7 flex justify-center shrink-0">
                    {i < 3 ? <span className="text-base">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span> : <span className="text-xs text-muted-foreground">{i + 1}</span>}
                  </div>
                  <div className="w-9 h-9 rounded-md bg-foreground/5 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-body truncate">{team.name}</p>
                    <p className="text-xs text-muted-foreground font-body">{team.memberCount} {t("members")}</p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-lg font-heading font-semibold">
                      {team.points} <span className="text-xs text-muted-foreground font-body">{t("points")}</span>
                    </p>
                  </div>
                </div>
              ));
            })()}
          </div>
          {stationTotals.every((s) => s.points === 0) && (
            <p className="text-sm text-muted-foreground font-body text-center">{t("noPoints")}</p>
          )}
        </div>
      )}

      {view === "analytics" && <PerformanceAnalytics />}

      {view === "trends" && isManager && <MonthlyTrends />}

      {view === "supervision" && isManager && <SupervisionFairness />}



      {(view === "achievements" || view === "individual") && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
            <Award className="w-4 h-4" /> {t("achievementsBoardNote")}
          </div>
          {ranked.every((e) => e.points === 0) ? (
            <p className="text-sm text-muted-foreground font-body">{t("noPoints")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ranked.map((e, i) => {
                const current = badgeFor(e.points, badges);
                const earned = badges.filter((b) => e.points >= b.min);
                return (
                  <div
                    key={e.id}
                    className={`p-4 rounded-xl border space-y-3 ${e.id === currentUser.id ? "border-accent bg-accent/5" : "border-border bg-card"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-foreground text-background flex items-center justify-center font-medium">
                          {e.name.charAt(0)}
                        </div>
                        <span className="absolute -bottom-1 -end-1 text-lg leading-none">{current.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {i < 3 && rankIcon(i)}
                          <EmployeeNameLink employeeId={e.id} employeeName={e.name} className="block text-sm font-medium font-body truncate" />
                        </div>
                        <p className="text-xs text-muted-foreground font-body truncate">
                          {roleLabel(e)} · {stationName(e.stationId || defaultStationId)}
                        </p>
                      </div>
                      <div className="ms-auto text-end shrink-0">
                        <p className="text-lg font-heading font-semibold leading-none">
                          {e.points}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-body">{t("points")}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{t("earnedBadges")}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {earned.length === 0 ? (
                          <span className="text-xs text-muted-foreground font-body">{t("noPoints")}</span>
                        ) : (
                          earned.map((b) => (
                            <span
                              key={b.key}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-body border ${b.key === current.key ? "bg-accent text-accent-foreground border-accent" : "border-border bg-muted/50 text-muted-foreground"}`}
                            >
                              <span>{b.icon}</span> {t(b.key)}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}