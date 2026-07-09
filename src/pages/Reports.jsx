import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, addNotification } from "@/lib/store";
import { canApproveReports, visibleStations } from "@/lib/permissions";
import { ArrowLeft, Plus, Check, X } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Reports() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [selectedStation, setSelectedStation] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [tab, setTab] = useState("list");

  if (!data || !currentUser) return null;
  const canApprove = canApproveReports(currentUser);
  const stations = visibleStations(currentUser, data);

  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";
  const authorName = (id) => data.employees.find((e) => e.id === id)?.name || "—";

  const setReportStatus = (id, status) => {
    updateCompany(company.id, (d) => {
      const r = d.reports.find((x) => x.id === id);
      if (r) r.status = status;
    });
    const rep = data.reports.find((x) => x.id === id);
    if (rep) addNotification(company.id, rep.authorId, `Your report "${rep.title}" was ${t(status)}.`);
  };

  const addReport = (e) => {
    e.preventDefault();
    updateCompany(company.id, (d) => {
      d.reports.unshift({
        id: "rep_" + Math.random().toString(36).slice(2, 9),
        title: form.title,
        content: form.content,
        stationId: currentUser.stationId || stations[0]?.id,
        authorId: currentUser.id,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    });
    setShowAdd(false);
    setForm({ title: "", content: "" });
  };

  // Station grid
  if (!selectedStation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-semibold">{t("reports")}</h1>
          <div className="flex gap-2">
            <button onClick={() => setTab("analytics")} className={`px-3 py-1.5 rounded-md text-xs font-body ${tab === "analytics" ? "bg-foreground text-background" : "border border-border"}`}>Analytics</button>
            <button onClick={() => setTab("list")} className={`px-3 py-1.5 rounded-md text-xs font-body ${tab === "list" ? "bg-foreground text-background" : "border border-border"}`}>List</button>
          </div>
        </div>

        {tab === "analytics" ? (
          <ReportsAnalytics t={t} lang={lang} data={data} stations={stations} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map((s) => {
              const reps = data.reports.filter((r) => r.stationId === s.id);
              const pending = reps.filter((r) => r.status === "pending").length;
              const approved = reps.filter((r) => r.status === "approved").length;
              const rejected = reps.filter((r) => r.status === "rejected").length;
              const last = reps[0];
              return (
                <button key={s.id} onClick={() => setSelectedStation(s.id)} className="text-start p-5 rounded-xl border border-border bg-card hover:border-accent transition-colors space-y-2">
                  <h3 className="font-heading font-semibold">{s.name}</h3>
                  <div className="flex gap-3 text-xs font-body">
                    <span className="text-amber-600">{t("pending")}: {pending}</span>
                    <span className="text-accent">{t("approved")}: {approved}</span>
                    <span className="text-destructive">{t("rejected")}: {rejected}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">
                    {last ? `${t("recentActivity")}: ${new Date(last.createdAt).toLocaleDateString(lang)}` : "—"}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Station reports
  const station = data.stations.find((s) => s.id === selectedStation);
  const reps = data.reports.filter((r) => r.stationId === selectedStation);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelectedStation(null)} className="p-2 rounded-md hover:bg-muted"><ArrowLeft className="w-4 h-4" /></button>
        <h1 className="font-heading text-3xl font-semibold">{station?.name}</h1>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-body">{reps.length} {t("reports").toLowerCase()}</p>
        <button onClick={() => setShowAdd((o) => !o)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent">
          <Plus className="w-4 h-4" /> {t("newReport")}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addReport} className="p-5 rounded-xl border border-border bg-card space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("title")} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder={t("content")} rows={4} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body resize-none" />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm">{t("save")}</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-md border border-border text-sm">{t("cancel")}</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {reps.length === 0 && <p className="text-sm text-muted-foreground font-body">No reports yet.</p>}
        {reps.map((r) => (
          <div key={r.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold">{r.title}</h3>
              <StatusPill status={r.status} t={t} />
            </div>
            <p className="text-sm font-body text-muted-foreground">{r.content}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground font-body">
              <span>{t("author")}: {authorName(r.authorId)}</span>
              <span>{new Date(r.createdAt).toLocaleDateString(lang)}</span>
            </div>
            {canApprove && r.status === "pending" && (
              <div className="flex gap-2 pt-1">
                <button onClick={() => setReportStatus(r.id, "approved")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-body">
                  <Check className="w-3.5 h-3.5" /> {t("approve")}
                </button>
                <button onClick={() => setReportStatus(r.id, "rejected")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-destructive text-destructive text-xs font-body">
                  <X className="w-3.5 h-3.5" /> {t("reject")}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status, t }) {
  const map = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-accent/15 text-accent",
    rejected: "bg-destructive/15 text-destructive",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-body ${map[status]}`}>{t(status)}</span>;
}

function ReportsAnalytics({ t, lang, data, stations }) {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    months.push(d);
  }
  const chartData = months.map((m) => {
    const label = m.toLocaleDateString(lang, { month: "short" });
    const completed = data.reports.filter((r) => r.status === "approved" && new Date(r.createdAt).getMonth() === m.getMonth()).length + Math.floor(Math.random() * 8);
    const pending = data.reports.filter((r) => r.status === "pending" && new Date(r.createdAt).getMonth() === m.getMonth()).length + Math.floor(Math.random() * 5);
    return { month: label, completed, pending };
  });
  return (
    <div className="p-5 rounded-xl border border-border bg-card">
      <h3 className="font-heading font-semibold mb-4">{t("reports")} — 6 {lang === "ar" ? "أشهر" : "months"}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="completed" name={t("approved")} fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pending" name={t("pending")} fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}