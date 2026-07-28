import React from "react";
import { TrendingUp, Users } from "lucide-react";

// WorkForce-style numbered stat cards for attendance and team members.
// Memoized — props are primitives, so unrelated dashboard re-renders skip this tree.
function DashboardStatCards({ attendanceRate, activeMembers, totalMembers, t }) {
  return (
    <div className="ops-kpi-grid grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="ops-kpi-card rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs font-body font-semibold text-foreground/80 mb-3">1. {t("attendanceRateLabel")}</p>
        <div className="flex items-center gap-3">
          <p className="hero-title text-3xl">{attendanceRate}%</p>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </div>
      </div>
      <div className="ops-kpi-card rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs font-body font-semibold text-foreground/80 mb-3">2. {t("employees")}</p>
        <div className="flex items-center gap-3">
          <p className="hero-title text-3xl">{totalMembers}</p>
          <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-body font-semibold text-accent">
            {activeMembers} {t("activeEmployees")}
          </span>
          <Users className="h-5 w-5 text-accent/70 ms-auto" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

export default React.memo(DashboardStatCards);