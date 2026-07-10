import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { badgeFor, getBadges } from "@/lib/rewards";
import TaskStats from "@/components/tasks/TaskStats";
import { X, AlertTriangle, Trophy } from "lucide-react";

// Per-station drilldown: task stats, stoppage issues, and employee performance.
export default function StationAnalyticsModal({ stationKey, stationName, members, onClose }) {
  const { t } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const empStation = (id) => data.employees.find((e) => e.id === id)?.stationId || null;
  const keyFor = (tg) => {
    if (tg.assignment_type === "station_team") return tg.assignment_id || tg.station_id || "unassigned";
    if (tg.assignment_type === "member") return tg.station_id || empStation(tg.employee_id) || "unassigned";
    if (tg.assignment_type === "hq_team") return "hq";
    return tg.station_id || "unassigned";
  };
  const stationTargets = targets.filter((tg) => keyFor(tg) === stationKey);

  const issues = [];
  for (const tg of stationTargets) {
    for (const c of Array.isArray(tg.comments) ? tg.comments : []) {
      if (c.is_issue) issues.push({ ...c, taskTitle: tg.title || t("setTarget") });
    }
  }
  issues.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const badges = getBadges(company);
  const ranked = [...members].map((e) => ({ ...e, points: e.points || 0 })).sort((a, b) => b.points - a.points);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 rounded-xl border border-border bg-card space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-xl font-semibold">{stationName}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground font-body">…</p>
        ) : (
          <>
            <TaskStats targets={stationTargets} t={t} />

            <div>
              <h4 className="font-heading text-base font-semibold flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" /> {t("stoppageIssues")}
              </h4>
              {issues.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body">{t("noIssuesReported")}</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {issues.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg border border-red-200 bg-red-50/50 text-sm font-body">
                      <p className="font-medium">{c.taskTitle}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{c.user_name}</p>
                      <p className="mt-1 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-heading text-base font-semibold flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4" /> {t("individualRanking")}
              </h4>
              {ranked.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body">{t("noPoints")}</p>
              ) : (
                <div className="space-y-2">
                  {ranked.map((e, i) => {
                    const badge = badgeFor(e.points, badges);
                    return (
                      <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background">
                        <span className="text-xs text-muted-foreground w-5 text-center">{i + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium shrink-0">
                          {e.name.charAt(0)}
                        </div>
                        <p className="flex-1 text-sm font-body truncate">{e.name}</p>
                        <span className="text-xs">{badge.icon}</span>
                        <p className="text-sm font-heading font-semibold">{e.points}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}