import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { visibleStations } from "@/lib/permissions";
import TeamStatusPanel from "@/components/dashboard/TeamStatusPanel";
import { Radio, Users, AlertTriangle, FileText, TrendingUp, MapPin, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/dateFormat";

const SAFETY_COLORS = { green: "bg-emerald-500", amber: "bg-amber-500", red: "bg-destructive" };

export default function StationManagerDashboard({ user, data, stoppageCount = 0 }) {
  const { t, lang } = useI18n();
  const stations = visibleStations(user, data);
  const stationIds = new Set(stations.map((s) => s.id));

  const team = data.employees.filter((e) => e.stationId && stationIds.has(e.stationId));
  const tasks = data.tasks.filter((tk) => stationIds.has(tk.stationId));
  const reports = data.reports.filter((r) => stationIds.has(r.stationId));
  const anon = data.anonymousReports.filter((a) => stationIds.has(a.stationId));
  const pendingReports = reports.filter((r) => r.status === "pending");
  const completed = tasks.filter((tk) => tk.status === "completed").length;
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const stats = [
    { icon: Users, label: t("team"), value: team.length, color: "text-accent" },
    { icon: TrendingUp, label: t("taskCompletion"), value: `${completionRate}%`, color: "text-foreground" },
    { icon: AlertTriangle, label: t("stoppageIssues"), value: stoppageCount, color: "text-destructive" },
    { icon: FileText, label: t("pendingReports"), value: pendingReports.length, color: "text-foreground" },
  ];

  const recent = [
    ...tasks.map((tk) => ({ type: "task", text: `${tk.title} — ${t(tk.status)}`, at: tk.createdAt })),
    ...reports.map((r) => ({ type: "report", text: `${r.title} — ${t(r.status)}`, at: r.createdAt })),
    ...anon.map((a) => ({ type: "anon", text: `${t(a.type)} (${t(a.priority)}) — ${t(a.status)}`, at: a.createdAt })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mb-2" dir="auto">{user.name}</p>
          <h1 className="hero-title text-4xl md:text-5xl">{t("myStation")}</h1>
        </div>
        <span className="px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-body tracking-wide">
          {t(user.role)}
        </span>
      </div>

      {/* Station cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {stations.map((s) => {
          const safety = data.safety.find((sf) => sf.stationId === s.id);
          return (
            <div key={s.id} className="p-4 rounded-xl border border-border bg-card flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-accent" strokeWidth={1.5} />
                <span className="text-sm font-medium font-body" dir="auto">{s.name}</span>
              </div>
              {s.location && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span dir="auto">{s.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 ms-auto">
                <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-xs text-muted-foreground font-body">{t("safetyLevel")}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${SAFETY_COLORS[safety?.level] || "bg-muted-foreground/40"}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-border divide-x divide-y divide-border rtl:divide-x-reverse">
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

      {/* Pending reports needing review */}
      <div className="p-6 border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="hero-title text-2xl">{t("pendingReports")}</h3>
          <Link to="/app/daily-report" className="text-xs text-muted-foreground font-body hover:text-foreground underline">
            {t("reports")}
          </Link>
        </div>
        {pendingReports.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">{t("noReply")}</p>
        ) : (
          <div className="divide-y divide-border">
            {pendingReports.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <p className="text-sm font-body flex-1" dir="auto">{r.title}</p>
                <p className="text-xs text-muted-foreground font-body shrink-0">{formatDate(r.createdAt, lang)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <TeamStatusPanel employees={team} t={t} />

      {/* Recent activity */}
      <div className="p-6 border border-border bg-card">
        <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mb-1">{formatDate(new Date(), lang, { month: "short" })}</p>
        <h3 className="hero-title text-2xl mb-4">{t("recentActivity")}</h3>
        <div className="divide-y divide-border">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body py-2">{t("noActivity")}</p>
          ) : (
            recent.map((r, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.type === "anon" ? "bg-destructive" : r.type === "report" ? "bg-amber-500" : "bg-accent"}`} />
                <p className="text-sm font-body flex-1" dir="auto">{r.text}</p>
                <p className="text-xs text-muted-foreground font-body shrink-0">{formatDate(r.at, lang)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}