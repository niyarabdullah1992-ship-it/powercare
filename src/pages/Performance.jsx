import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { badgeFor, nextBadge, getBadges } from "@/lib/rewards";
import { getRoleLabel } from "@/lib/roles";
import { Trophy, Medal, Crown, Users, Award } from "lucide-react";
import PerformanceAnalytics from "@/components/performance/PerformanceAnalytics";
import MonthlyTrends from "@/components/performance/MonthlyTrends";
import BadgeLegend from "@/components/performance/BadgeLegend";
import StationComparison from "@/components/performance/StationComparison";
import EmployeeComparisonView from "@/components/performance/EmployeeComparisonView";
import EmployeeSingleReport from "@/components/performance/EmployeeSingleReport";
import BrandingSettingsCard from "@/components/reports/BrandingSettingsCard";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";
import { isCompanyOwner } from "@/lib/permissions";
import { Palette } from "lucide-react";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";

export default function Performance() {
  const { t, dir, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [view, setView] = useState("individual");
  const [showBranding, setShowBranding] = useState(false);

  if (!data || !currentUser) return null;

  const canBrand = isCompanyOwner(currentUser, data) || currentUser.role === "director";

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
        </div>
        <div className="performance-hub-tabs flex items-center gap-1.5">
          <button
            onClick={() => setView("individual")}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${view === "individual" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {t("individualRanking")}
          </button>
          {isManager && (<>
          <button
            onClick={() => setView("station")}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${view === "station" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {t("stationRanking")}
          </button>
          <button
            onClick={() => setView("comparison")}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${view === "comparison" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {t("stationComparison")}
          </button>
          <button
            onClick={() => setView("individualReport")}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${view === "individualReport" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {t("individualReport")}
          </button>
          </>)}
          <button
            onClick={() => setView("employeeComparison")}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${view === "employeeComparison" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {t("employeeComparison")}
          </button>
          <button
            onClick={() => setView("achievements")}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${view === "achievements" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {t("achievementsBoard")}
          </button>
          {isManager && (<>
          <button
            onClick={() => setView("analytics")}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${view === "analytics" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {t("analytics")}
          </button>
          <button
            onClick={() => setView("trends")}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${view === "trends" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {lang === "ar" ? "الاتجاهات الشهرية" : "Monthly trends"}
          </button>
          </>)}
          {canBrand && (
            <button
              onClick={() => setShowBranding((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border border-border hover:bg-muted transition"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: data.reportBranding?.color || "#b07d3f" }} />
              {lang === "ar" ? "هوية التقارير" : "Report branding"}
            </button>
          )}
        </div>
      </div>

      {showBranding && canBrand && (
        <BrandingSettingsCard
          companyId={company.id}
          branding={data.reportBranding}
          companyName={data.name || company?.name || ""}
          lang={lang}
          onClose={() => setShowBranding(false)}
        />
      )}

      {(view === "individual" || view === "achievements") && (
        <div className="flex justify-end">
          <ComparisonExportButtons
            title={view === "achievements" ? t("achievementsBoard") : t("individualRanking")}
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

      {/* Badge tiers legend */}
      {view !== "comparison" && view !== "employeeComparison" && view !== "individualReport" && view !== "trends" && <BadgeLegend />}

      {view === "individual" && (
        <div className="space-y-2">
          {ranked.every((e) => e.points === 0) ? (
            <p className="text-sm text-muted-foreground font-body">{t("noPoints")}</p>
          ) : (
            ranked.map((e, i) => {
              const badge = badgeFor(e.points, badges);
              const next = nextBadge(e.points, badges);
              const pct = next ? Math.min(Math.round((e.points / next.min) * 100), 100) : 100;
              return (
                <div
                  key={e.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${e.id === currentUser.id ? "border-accent bg-accent/5" : "border-border bg-card"}`}
                >
                  <div className="w-7 flex justify-center shrink-0">{rankIcon(i)}</div>
                  <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium shrink-0">
                    {e.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <EmployeeNameLink employeeId={e.id} employeeName={e.name} className="block text-sm font-medium font-body truncate" />
                      <span className="text-[10px] text-muted-foreground">{roleLabel(e)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-body">
                      {stationName(e.stationId || defaultStationId)}
                    </p>
                    {next && (
                      <div className="mt-1.5">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-body">
                          {t("nextBadge")}: {next.icon} {t(next.key)} ({next.min - e.points} {t("points")})
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-end shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-body">
                      {badge.icon} {t(badge.key)}
                    </span>
                    <p className="text-lg font-heading font-semibold">
                      {e.points} <span className="text-xs text-muted-foreground font-body">{t("points")}</span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

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



      {view === "achievements" && (
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