import React, { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, visibleEmployees, canSeeAllStations } from "@/lib/permissions";
import { Radio, ListTodo, AlertTriangle, FileText, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { formatDate } from "@/lib/dateFormat";

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { data, currentUser } = useAuth();
  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data);
  const stationIds = new Set(stations.map((s) => s.id));
  const employees = canSeeAllStations(currentUser)
    ? data.employees
    : data.employees.filter((e) => !e.stationId || stationIds.has(e.stationId));

  const isEmployee = currentUser.role === "employee";

  if (isEmployee) return <EmployeeDashboard t={t} lang={lang} data={data} user={currentUser} />;

  // Manager dashboard
  const tasks = data.tasks.filter((tk) => stationIds.has(tk.stationId));
  const reports = data.reports.filter((r) => stationIds.has(r.stationId));
  const anon = data.anonymousReports;
  const activeStations = stations.filter((s) => s.status === "active").length;
  const stopped = tasks.filter((tk) => tk.status === "stopped").length;
  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const completed = tasks.filter((tk) => tk.status === "completed").length;
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const stats = [
    { icon: Radio, label: t("activeStations"), value: `${activeStations}/${stations.length}`, color: "text-accent" },
    { icon: TrendingUp, label: t("taskCompletion"), value: `${completionRate}%`, color: "text-foreground" },
    { icon: AlertTriangle, label: t("stoppedTasks"), value: stopped, color: "text-destructive" },
    { icon: FileText, label: t("pendingReports"), value: pendingReports, color: "text-foreground" },
  ];

  // 6-month synthetic chart data
  const monthLabels = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthLabels.push(formatDate(d, lang, { month: "short" }));
  }
  const chartData = monthLabels.map((m, i) => ({
    month: m,
    completed: Math.round(20 + Math.random() * 30 + i * 2),
    pending: Math.round(5 + Math.random() * 12),
  }));

  const recent = [
    ...tasks.map((tk) => ({ type: "task", text: `${tk.title} — ${t(tk.status)}`, at: tk.createdAt })),
    ...reports.map((r) => ({ type: "report", text: `${r.title} — ${t(r.status)}`, at: r.createdAt })),
    ...anon.map((a) => ({ type: "anon", text: `${t(a.type)} (${t(a.priority)}) — ${t(a.status)}`, at: a.createdAt })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("overview")}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{data.name} · {t(currentUser.role)}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="p-5 rounded-xl border border-border bg-card">
            <s.icon className={`w-5 h-5 mb-3 ${s.color}`} strokeWidth={1.75} />
            <p className="text-3xl font-heading font-semibold">{s.value}</p>
            <p className="text-xs text-muted-foreground font-body mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="font-heading font-semibold mb-4">{t("taskCompletion")} — 6 {lang === "ar" ? "أشهر" : "months"}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="completed" name={t("completed")} fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name={t("pending")} fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="font-heading font-semibold mb-4">{t("reports")} — {t("taskCompletion")}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="completed" name={t("approved")} stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pending" name={t("pending")} stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="p-5 rounded-xl border border-border bg-card">
        <h3 className="font-heading font-semibold mb-4">{t("recentActivity")}</h3>
        <div className="space-y-2">
          {recent.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <p className="text-sm font-body">{r.text}</p>
              <p className="text-xs text-muted-foreground font-body">{formatDate(r.at, lang)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard({ t, lang, data, user }) {
  const myTasks = data.tasks.filter((tk) => tk.assignedTo === user.id);
  const open = myTasks.filter((tk) => tk.status === "pending" || tk.status === "in_progress");
  const myAnon = data.anonymousReports.filter((a) => a.anonymousId === user.anonymousId);

  const totalGoal = myTasks.reduce((s, tk) => s + (tk.dailyTarget || 0), 0);
  const totalProgress = myTasks.reduce((s, tk) => s + (tk.progress || 0), 0);
  const goalPct = totalGoal ? Math.round((totalProgress / totalGoal) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("myDay")}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{user.name}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card">
          <ListTodo className="w-5 h-5 mb-3 text-accent" strokeWidth={1.75} />
          <p className="text-3xl font-heading font-semibold">{open.length}</p>
          <p className="text-xs text-muted-foreground font-body mt-1">{t("openTasks")}</p>
        </div>
        <div className="p-5 rounded-xl border border-border bg-card">
          <TrendingUp className="w-5 h-5 mb-3 text-foreground" strokeWidth={1.75} />
          <p className="text-3xl font-heading font-semibold">{goalPct}%</p>
          <p className="text-xs text-muted-foreground font-body mt-1">{t("dailyGoal")}</p>
        </div>
        <div className="p-5 rounded-xl border border-border bg-card">
          <AlertTriangle className="w-5 h-5 mb-3 text-destructive" strokeWidth={1.75} />
          <p className="text-3xl font-heading font-semibold">{myAnon.length}</p>
          <p className="text-xs text-muted-foreground font-body mt-1">{t("anonymous")}</p>
        </div>
      </div>
      <div className="p-5 rounded-xl border border-border bg-card">
        <h3 className="font-heading font-semibold mb-3">{t("openTasks")}</h3>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">{t("noTasks")}</p>
        ) : (
          <div className="space-y-2">
            {open.map((tk) => (
              <div key={tk.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-body">{tk.title}</p>
                  <p className="text-xs text-muted-foreground">{t(tk.status)} · {tk.progress}/{tk.dailyTarget}</p>
                </div>
                <span className="text-xs text-muted-foreground">{Math.round((tk.progress / (tk.dailyTarget || 1)) * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}