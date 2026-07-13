import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, canSeeAllStations, visibleEmployees, canApproveReports, canReplyAnon, isCompanyOwner } from "@/lib/permissions";
import TeamStatusPanel from "@/components/dashboard/TeamStatusPanel";
import WelcomeHero from "@/components/dashboard/WelcomeHero";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import { Radio, AlertTriangle, FileText, TrendingUp, Bell, Megaphone, Palette } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { formatDate } from "@/lib/dateFormat";
import { base44 } from "@/api/base44Client";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";
import StationManagerDashboard from "@/components/dashboard/StationManagerDashboard";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import { queryClientInstance } from "@/lib/query-client";
import BrandingSettingsCard from "@/components/reports/BrandingSettingsCard";

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { data, currentUser, company, refresh } = useAuth();
  const [stoppageCount, setStoppageCount] = useState(0);
  const [showBranding, setShowBranding] = useState(false);

  const loadStoppage = async () => {
    if (!currentUser) return;
    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "listTargets",
        userRole: currentUser.role,
        userId: currentUser.id,
        stationId: currentUser.stationId || null,
        managedStations: currentUser.managedStations || [],
      });
      const list = res?.data?.targets || [];
      let count = 0;
      for (const tg of list) {
        for (const c of Array.isArray(tg.comments) ? tg.comments : []) {
          if (c.is_issue) count++;
        }
      }
      setStoppageCount(count);
    } catch {
      setStoppageCount(0);
    }
  };

  useEffect(() => {
    loadStoppage();
  }, [currentUser?.id]);

  // Pull-to-refresh: full state reload — local fetches, tanstack-query caches,
  // and the AuthContext offline/online store sync.
  const handleRefresh = async () => {
    await Promise.allSettled([loadStoppage(), queryClientInstance.invalidateQueries()]);
    refresh();
  };

  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data);
  const stationIds = new Set(stations.map((s) => s.id));

  const unreadNotifs = data.notifications.filter((n) => n.userId === currentUser.id && !n.read).length;
  const pendingReportsCount = data.reports.filter((r) => stationIds.has(r.stationId) && r.status === "pending").length;
  const anonOpenCount = data.anonymousReports.filter((a) => stationIds.has(a.stationId) && a.status === "open").length;

  const welcomeAlerts = [
    { key: "notifications", icon: Bell, label: t("notifications"), value: unreadNotifs },
    { key: "stoppage", icon: AlertTriangle, label: t("stoppageIssues"), value: stoppageCount },
    ...(canApproveReports(currentUser) ? [{ key: "reports", icon: FileText, label: t("pendingReports"), value: pendingReportsCount }] : []),
    ...(canReplyAnon(currentUser) ? [{ key: "anon", icon: Megaphone, label: t("anonymous"), value: anonOpenCount }] : []),
  ];
  const welcomeHero = (
    <WelcomeHero name={currentUser.name} companyName={data.name} t={t} lang={lang} alerts={welcomeAlerts} employee={currentUser} companyId={company.id} />
  );

  const isEmployee = currentUser.role === "employee";
  const canEditBranding = isCompanyOwner(currentUser, data) || currentUser.role === "director";

  if (isEmployee) return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        {welcomeHero}
        <EmployeeDashboard user={currentUser} company={company} data={data} />
      </div>
    </PullToRefresh>
  );

  // Station-scoped managers get their own station-focused dashboard.
  if (currentUser.role === "station_manager" || currentUser.role === "pgm") {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6">
          {welcomeHero}
          <StationManagerDashboard user={currentUser} data={data} stoppageCount={stoppageCount} />
        </div>
      </PullToRefresh>
    );
  }

  // Manager dashboard
  const tasks = data.tasks.filter((tk) => stationIds.has(tk.stationId));
  const reports = data.reports.filter((r) => stationIds.has(r.stationId));
  const anon = data.anonymousReports;
  const activeStations = stations.filter((s) => s.status === "active").length;
  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const completed = tasks.filter((tk) => tk.status === "completed").length;
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const stats = [
    { icon: Radio, label: t("activeStations"), value: `${activeStations}/${stations.length}`, color: "text-accent" },
    { icon: TrendingUp, label: t("taskCompletion"), value: `${completionRate}%`, color: "text-foreground" },
    { icon: AlertTriangle, label: t("stoppageIssues"), value: stoppageCount, color: "text-destructive" },
    { icon: FileText, label: t("pendingReports"), value: pendingReports, color: "text-foreground" },
  ];

  // Real six-month task activity — stable across renders and based on company data.
  const monthBuckets = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    monthBuckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: formatDate(date, lang, { month: "short" }),
    });
  }
  const chartData = monthBuckets.map(({ key, label }) => {
    const monthlyTasks = tasks.filter((task) => {
      const date = new Date(task.createdAt);
      return `${date.getFullYear()}-${date.getMonth()}` === key;
    });
    return {
      month: label,
      completed: monthlyTasks.filter((task) => task.status === "completed").length,
      pending: monthlyTasks.filter((task) => task.status !== "completed").length,
    };
  });

  const recent = [
    ...tasks.map((tk) => ({ type: "task", text: `${tk.title} — ${t(tk.status)}`, at: tk.createdAt })),
    ...reports.map((r) => ({ type: "report", text: `${r.title} — ${t(r.status)}`, at: r.createdAt })),
    ...anon.map((a) => ({ type: "anon", text: `${t(a.type)} (${t(a.priority)}) — ${t(a.status)}`, at: a.createdAt })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-8">
      {welcomeHero}
      <OnboardingChecklist data={data} lang={lang} t={t} />
      <div className="border-b border-border pb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mb-2">{data.name}</p>
          <h1 className="hero-title text-4xl md:text-5xl">{t("overview")}</h1>
        </div>
        <div className="flex items-center gap-3">
          {canEditBranding && (
            <button
              onClick={() => setShowBranding((value) => !value)}
              className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-body hover:bg-muted"
            >
              <Palette className="h-3.5 w-3.5 text-accent" />
              {t("logoSettings")}
            </button>
          )}
          <span className="px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-body tracking-wide">
            {t(currentUser.role)}
          </span>
        </div>
      </div>

      {showBranding && canEditBranding && (
        <BrandingSettingsCard
          companyId={company.id}
          branding={data.reportBranding}
          companyName={data.name || company?.name || ""}
          lang={lang}
          onClose={() => setShowBranding(false)}
        />
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border shadow-sm divide-x divide-y divide-border rtl:divide-x-reverse lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className="p-6 bg-card hover:bg-muted/40 transition-colors">
            <div className="flex items-center justify-between mb-5">
              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full bg-accent/10 ${s.color}`}>
                <s.icon className="w-4 h-4" strokeWidth={1.5} />
              </span>
              <span className="hero-title text-base text-muted-foreground/40">{["I", "II", "III", "IV"][i]}</span>
            </div>
            <p className="hero-title text-4xl">{s.value}</p>
            <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mb-1">{t("sixMonthsLabel")}</p>
          <h3 className="hero-title text-2xl mb-5">{t("taskCompletion")}</h3>
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
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mb-1">{t("taskCompletion")}</p>
          <h3 className="hero-title text-2xl mb-5">{t("productivityTrend")}</h3>
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

      <TeamStatusPanel employees={visibleEmployees(currentUser, data)} t={t} />

      {/* Recent activity */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mb-1">{formatDate(new Date(), lang, { month: "short" })}</p>
        <h3 className="hero-title text-2xl mb-4">{t("recentActivity")}</h3>
        <div className="divide-y divide-border">
          {recent.map((r, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.type === "anon" ? "bg-destructive" : r.type === "report" ? "bg-amber-500" : "bg-accent"}`} />
              <p className="text-sm font-body flex-1">{r.text}</p>
              <p className="text-xs text-muted-foreground font-body shrink-0">{formatDate(r.at, lang)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}