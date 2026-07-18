import React from "react";
import { TrendingUp, UserCheck, UserX, CalendarDays } from "lucide-react";

// Daily workforce snapshot: rate, task progress, present, absent, and approved leave.
function DashboardStatCards({ attendanceRate, completed, total, presentCount, absentCount, onLeaveCount, t }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-body font-semibold text-foreground/80 mb-3">1. {t("attendanceRateLabel")}</p>
        <div className="flex items-center gap-3">
          <p className="hero-title text-4xl">{attendanceRate}%</p>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-body font-semibold text-foreground/80 mb-3">2. {t("completedTasks")}</p>
        <p className="hero-title text-4xl">
          {completed} <span className="text-muted-foreground/50 text-2xl">/ {total}</span>
        </p>
      </div>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <p className="text-xs font-body font-semibold text-emerald-800 mb-3">3. {t("totalPresent")}</p>
        <div className="flex items-center gap-3"><p className="hero-title text-4xl text-emerald-800">{presentCount}</p><UserCheck className="h-5 w-5 text-emerald-600 ms-auto" /></div>
      </div>
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
        <p className="text-xs font-body font-semibold text-red-800 mb-3">4. {t("totalAbsent")}</p>
        <div className="flex items-center gap-3"><p className="hero-title text-4xl text-red-800">{absentCount}</p><UserX className="h-5 w-5 text-red-600 ms-auto" /></div>
      </div>
      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
        <p className="text-xs font-body font-semibold text-violet-800 mb-3">5. {t("onLeaveStatus")}</p>
        <div className="flex items-center gap-3"><p className="hero-title text-4xl text-violet-800">{onLeaveCount}</p><CalendarDays className="h-5 w-5 text-violet-600 ms-auto" /></div>
      </div>
    </div>
  );
}

export default React.memo(DashboardStatCards);