import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { badgeFor, nextBadge, BADGES } from "@/lib/rewards";
import { Trophy, Medal, Crown, Users, Building2, Award } from "lucide-react";

export default function Performance() {
  const { t, dir } = useI18n();
  const { data, currentUser } = useAuth();
  const [view, setView] = useState("individual");

  if (!data || !currentUser) return null;

  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || t("hq");
  const roleLabel = (r) => t(r) || r;

  const ranked = [...data.employees]
    .map((e) => ({ ...e, points: e.points || 0 }))
    .sort((a, b) => b.points - a.points);

  const stationTotals = data.stations
    .map((s) => {
      const members = data.employees.filter((e) => e.stationId === s.id);
      const total = members.reduce((sum, e) => sum + (e.points || 0), 0);
      return { ...s, points: total, memberCount: members.length };
    })
    .sort((a, b) => b.points - a.points);

  const hqMembers = data.employees.filter((e) => !e.stationId);
  const hqTotal = hqMembers.reduce((sum, e) => sum + (e.points || 0), 0);

  const rankIcon = (i) =>
    i === 0 ? <Crown className="w-4 h-4 text-yellow-500" /> :
    i === 1 ? <Medal className="w-4 h-4 text-gray-400" /> :
    i === 2 ? <Medal className="w-4 h-4 text-amber-600" /> :
    <span className="text-xs text-muted-foreground">{i + 1}</span>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-heading text-3xl font-semibold flex items-center gap-2">
          <Trophy className="w-6 h-6" /> {t("performance")}
        </h1>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setView("individual")}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${view === "individual" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {t("individualRanking")}
          </button>
          <button
            onClick={() => setView("station")}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${view === "station" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {t("stationRanking")}
          </button>
          <button
            onClick={() => setView("achievements")}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${view === "achievements" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {t("achievementsBoard")}
          </button>
        </div>
      </div>

      {/* Badge tiers legend */}
      <div className="flex flex-wrap gap-2">
        {BADGES.map((b) => (
          <span key={b.key} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border border-border bg-card">
            <span>{b.icon}</span> {t(b.key)} · {b.min}+
          </span>
        ))}
      </div>

      {view === "individual" ? (
        <div className="space-y-2">
          {ranked.every((e) => e.points === 0) ? (
            <p className="text-sm text-muted-foreground font-body">{t("noPoints")}</p>
          ) : (
            ranked.map((e, i) => {
              const badge = badgeFor(e.points);
              const next = nextBadge(e.points);
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
                      <p className="text-sm font-medium font-body truncate">{e.name}</p>
                      <span className="text-[10px] text-muted-foreground">{roleLabel(e.role)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-body">
                      {e.stationId ? stationName(e.stationId) : t("hq")}
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
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-foreground/5 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium font-body">{t("hq")}</p>
                  <p className="text-xs text-muted-foreground font-body">{hqMembers.length} {t("members")}</p>
                </div>
              </div>
              <p className="text-lg font-heading font-semibold">
                {hqTotal} <span className="text-xs text-muted-foreground font-body">{t("points")}</span>
              </p>
            </div>
            {stationTotals.map((s, i) => (
              <div key={s.id} className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 flex justify-center shrink-0">{rankIcon(i)}</div>
                  <div className="w-9 h-9 rounded-md bg-foreground/5 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium font-body">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-body">{s.memberCount} {t("members")}</p>
                  </div>
                </div>
                <p className="text-lg font-heading font-semibold">
                  {s.points} <span className="text-xs text-muted-foreground font-body">{t("points")}</span>
                </p>
              </div>
            ))}
          </div>
          {stationTotals.every((s) => s.points === 0) && hqTotal === 0 && (
            <p className="text-sm text-muted-foreground font-body text-center">{t("noPoints")}</p>
          )}
        </div>
      )}

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
                const current = badgeFor(e.points);
                const earned = BADGES.filter((b) => e.points >= b.min);
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
                          <p className="text-sm font-medium font-body truncate">{e.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground font-body truncate">
                          {roleLabel(e.role)} · {e.stationId ? stationName(e.stationId) : t("hq")}
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