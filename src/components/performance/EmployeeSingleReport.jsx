import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { badgeFor, nextBadge, getBadges } from "@/lib/rewards";
import { getRoleLabel } from "@/lib/roles";
import { Search, Award, CheckCircle2, Clock, FileBadge, CalendarDays } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import moment from "moment";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";

// Full performance report for a single selected employee — points, badge, tasks,
// certificates, leave, and a completed-tasks trend over the last 6 months.
export default function EmployeeSingleReport({ t }) {
  const { data, company, currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(currentUser?.id || null);
  const [showResults, setShowResults] = useState(false);
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

  const filteredEmployees = useMemo(() => {
    if (!data) return [];
    return data.employees.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  const emp = useMemo(() => data?.employees.find((e) => e.id === selectedId) || null, [data, selectedId]);

  const trend = useMemo(() => {
    if (!emp) return [];
    const months = Array.from({ length: 6 }, (_, i) => moment().subtract(5 - i, "months"));
    const buckets = months.map((m) => ({ key: m.format("YYYY-MM"), label: m.format("MMM YY"), total: 0 }));
    for (const tk of data.tasks || []) {
      if (tk.assignedTo !== emp.id || tk.status !== "completed") continue;
      const key = moment(tk.createdAt).format("YYYY-MM");
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.total += 1;
    }
    for (const tg of targets) {
      if (tg.employee_id !== emp.id) continue;
      const completed = Number(tg.completed_tasks) || 0;
      if (completed <= 0) continue;
      const key = moment(tg.created_date || tg.created_at).format("YYYY-MM");
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.total += completed;
    }
    return buckets;
  }, [data, emp, targets]);

  if (!data || !emp) return null;

  const badges = getBadges(company);
  const badge = badgeFor(emp.points || 0, badges);
  const next = nextBadge(emp.points || 0, badges);
  const pct = next ? Math.min(Math.round(((emp.points || 0) / next.min) * 100), 100) : 100;
  const stationName = emp.stationId ? data.stations.find((s) => s.id === emp.stationId)?.name : t("hq");

  const memberTargets = targets.filter((tg) => tg.employee_id === emp.id);
  const completedCount = (data.tasks || []).filter((tk) => tk.assignedTo === emp.id && tk.status === "completed").length
    + memberTargets.reduce((sum, tg) => sum + (Number(tg.completed_tasks) || 0), 0);
  const overdueCount = memberTargets.filter((tg) => tg.status === "overdue").length;
  const certificates = (emp.certificates || []).length;
  const leaves = emp.leaveRequests || [];
  const approvedDays = leaves.filter((r) => r.status === "approved").reduce((sum, r) => sum + (r.days || 0), 0);

  const stats = [
    { icon: CheckCircle2, value: completedCount, label: t("completedCount"), color: "text-emerald-700" },
    { icon: Clock, value: overdueCount, label: t("overdue"), color: "text-red-700" },
    { icon: FileBadge, value: certificates, label: t("certificates"), color: "text-foreground" },
    { icon: CalendarDays, value: approvedDays, label: t("days"), color: "text-foreground" },
  ];

  const axisProps = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false };

  return (
    <div className="space-y-4">
      {/* Employee picker */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          placeholder={t("search")}
          className="w-full ps-9 pe-3 py-2 rounded-md border border-input text-sm font-body"
        />
        {showResults && (
          <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-border bg-card shadow-md">
            {filteredEmployees.length === 0 ? (
              <p className="text-xs text-muted-foreground font-body p-3">{t("noResults")}</p>
            ) : (
              filteredEmployees.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onMouseDown={() => { setSelectedId(e.id); setSearch(e.name); setShowResults(false); }}
                  className={`w-full text-start px-3 py-2 text-sm font-body hover:bg-muted transition ${e.id === selectedId ? "bg-muted font-medium" : ""}`}
                >
                  {e.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <ComparisonExportButtons
          title={`${t("individualReport")} — ${emp.name}`}
          headers={[t("category"), t("title"), t("status")]}
          rows={[
            ...stats.map((s) => [t("individualReport"), s.label, s.value]),
            ...trend.map((r) => [t("productivityTrend"), r.label, r.total]),
          ]}
        />
      </div>

      {/* Profile header */}
      <div className="p-5 rounded-xl border border-border bg-card flex items-center gap-4 flex-wrap">
        <div className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-medium shrink-0">
          {emp.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-lg font-semibold truncate">{emp.name}</p>
          <p className="text-xs text-muted-foreground font-body">{emp.customTitle || getRoleLabel(company, emp.role, t)} · {stationName}</p>
        </div>
        <div className="text-end shrink-0">
          <span className="inline-flex items-center gap-1 text-xs font-body">{badge.icon} {t(badge.key)}</span>
          <p className="text-2xl font-heading font-semibold">{emp.points || 0} <span className="text-xs text-muted-foreground font-body">{t("points")}</span></p>
        </div>
      </div>

      {next && (
        <div className="px-5 -mt-2">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-body">
            {t("nextBadge")}: {next.icon} {t(next.key)} ({next.min - (emp.points || 0)} {t("points")})
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <span className={`w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-xl font-semibold leading-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trend */}
      <div className="p-5 rounded-xl border border-border bg-card">
        <h3 className="font-heading text-base font-semibold flex items-center gap-2 mb-4">
          <Award className="w-4 h-4" /> {t("productivityTrend")}
        </h3>
        <div className="w-full h-56" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="empGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="total" name={t("completedTasks")} stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#empGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}