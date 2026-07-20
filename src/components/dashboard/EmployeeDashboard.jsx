import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { ListTodo, CheckCircle2, AlertTriangle, Radio, UserCircle } from "lucide-react";
import EmployeePoints from "@/components/employees/EmployeePoints";
import PresenceStatusPicker from "@/components/employees/PresenceStatusPicker";
import QuickCheckInCard from "@/components/attendance/QuickCheckInCard";
import EmployeeTour from "@/components/onboarding/EmployeeTour";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";

export default function EmployeeDashboard({ user, company, data }) {
  const { t } = useI18n();
  const effectiveStationId = user.stationId || data?.stations?.[0]?.id || null;
  const station = data?.stations.find((s) => s.id === effectiveStationId) || null;
  const manager = station?.managerId ? data?.employees.find((e) => e.id === station.managerId) : null;
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    base44.functions
      .invoke("supabaseTargets", {
        action: "listTargets",
        userRole: user.role,
        userId: user.id,
        stationId: user.stationId || null,
        managedStations: user.managedStations || [],
      })
      .then((res) => { if (active) setTargets(res?.data?.targets || []); })
      .catch(() => { if (active) setTargets([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.id]);

  const mine = targets.filter((tg) => {
    if (tg.assignment_type === "member") return tg.employee_id === user.id;
    if (tg.assignment_type === "station_team") return tg.assignment_id === effectiveStationId;
    if (tg.assignment_type === "hq_team") return tg.assignment_id === effectiveStationId || !tg.assignment_id;
    return false;
  });
  const open = mine.filter((tg) => tg.status === "active");
  const completed = mine.filter((tg) => tg.status === "completed");
  const urgent = open.filter((tg) => tg.priority === "urgent");

  return (
    <div className="space-y-8">
      {/* First-login onboarding tour (shows once per employee) */}
      <EmployeeTour user={user} company={company} />
      {/* One-tap GPS check-in — the very first thing on app open */}
      <QuickCheckInCard currentUser={user} company={company} />

      <div className="border-b border-border pb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <EmployeeNameLink employeeId={user.id} employeeName={user.name} className="inline-block text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mb-2" />
          <h1 className="hero-title text-4xl md:text-5xl">{t("myDay")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <PresenceStatusPicker user={user} />
          <EmployeePoints points={user.points || 0} company={company} />
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-border bg-card flex flex-wrap items-center gap-x-8 gap-y-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-accent" strokeWidth={1.5} />
          <span className="text-xs text-muted-foreground font-body">{t("station")}:</span>
          <span className="text-sm font-medium font-body">{station ? station.name : "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          <UserCircle className="w-4 h-4 text-accent" strokeWidth={1.5} />
          <span className="text-xs text-muted-foreground font-body">{t("manager")}:</span>
          {manager ? <EmployeeNameLink employeeId={manager.id} employeeName={manager.name} className="text-sm font-medium font-body" /> : <span className="text-sm font-medium font-body">{t("noManager")}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl overflow-hidden border border-border divide-x divide-y sm:divide-y-0 divide-border rtl:divide-x-reverse">
        <div className="p-6 bg-card">
          <ListTodo className="w-4 h-4 mb-5 text-accent" strokeWidth={1.5} />
          <p className="hero-title text-4xl">{open.length}</p>
          <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mt-2">{t("openTasks")}</p>
        </div>
        <div className="p-6 bg-card">
          <CheckCircle2 className="w-4 h-4 mb-5 text-foreground" strokeWidth={1.5} />
          <p className="hero-title text-4xl">{completed.length}</p>
          <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mt-2">{t("completed")}</p>
        </div>
        <div className="p-6 bg-card">
          <AlertTriangle className="w-4 h-4 mb-5 text-destructive" strokeWidth={1.5} />
          <p className="hero-title text-4xl">{urgent.length}</p>
          <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mt-2">{t("urgent")}</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="hero-title text-2xl">{t("openTasks")}</h3>
          <Link to="/app/tasks" className="text-xs text-muted-foreground font-body hover:text-foreground underline">
            {t("myTasks")}
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-muted" />
            ))}
          </div>
        ) : open.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">{t("noTasks")}</p>
        ) : (
          <div className="divide-y divide-border">
            {open.map((tg) => {
              const pct = tg.task_target ? Math.min(100, Math.round((tg.completed_tasks / tg.task_target) * 100)) : 0;
              return (
                <div key={tg.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-body">{tg.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(tg.priority)} · {tg.completed_tasks}/{tg.task_target}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}