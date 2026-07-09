import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, addNotification } from "@/lib/store";
import { canCreateTasks } from "@/lib/permissions";
import { Play, Pause, Check, Plus, Copy } from "lucide-react";

const STOP_REASONS = ["weather", "equipment", "power", "access", "labor"];

export default function MyTasks() {
  const { t } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [active, setActive] = useState(null);
  const [progress, setProgress] = useState(0);
  const [stopReason, setStopReason] = useState("equipment");
  const [stopNote, setStopNote] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  if (!data || !currentUser) return null;

  const myTasks = data.tasks.filter((tk) => tk.assignedTo === currentUser.id);
  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";

  const claim = (id) => {
    updateCompany(company.id, (d) => {
      const tk = d.tasks.find((x) => x.id === id);
      if (tk) tk.status = "in_progress";
    });
  };

  const logProgress = (id) => {
    updateCompany(company.id, (d) => {
      const tk = d.tasks.find((x) => x.id === id);
      if (tk) tk.progress = Math.min((tk.progress || 0) + Number(progress), tk.dailyTarget);
    });
    setProgress(0);
    setActive(null);
  };

  const stop = (id) => {
    updateCompany(company.id, (d) => {
      const tk = d.tasks.find((x) => x.id === id);
      if (tk) {
        tk.status = "stopped";
        tk.stops.push({ reason: stopReason, note: stopNote, at: new Date().toISOString() });
      }
    });
    addNotification(
      company.id,
      data.directorId,
      `Task "${data.tasks.find((x) => x.id === id)?.title}" was stopped (${t(stopReason)}).`
    );
    setActive(null);
    setStopNote("");
  };

  const resume = (id) => {
    updateCompany(company.id, (d) => {
      const tk = d.tasks.find((x) => x.id === id);
      if (tk) tk.status = "in_progress";
    });
  };

  const complete = (id) => {
    updateCompany(company.id, (d) => {
      const tk = d.tasks.find((x) => x.id === id);
      if (tk) {
        tk.status = "completed";
        tk.progress = tk.dailyTarget;
      }
    });
    addNotification(company.id, data.directorId, `Task "${data.tasks.find((x) => x.id === id)?.title}" completed by ${currentUser.name}.`);
  };

  const createTask = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    updateCompany(company.id, (d) => {
      d.tasks.push({
        id: "task_" + Math.random().toString(36).slice(2, 9),
        title: fd.get("title"),
        description: fd.get("description") || "",
        stationId: currentUser.stationId || d.stations[0]?.id,
        assignedTo: currentUser.id,
        status: "pending",
        dailyTarget: Number(fd.get("dailyTarget") || 1),
        progress: 0,
        stops: [],
        createdAt: new Date().toISOString(),
      });
    });
    setShowCreate(false);
  };

  const applyTemplate = (tpl) => {
    updateCompany(company.id, (d) => {
      d.tasks.push({
        id: "task_" + Math.random().toString(36).slice(2, 9),
        title: tpl.title,
        description: tpl.description,
        stationId: currentUser.stationId || d.stations[0]?.id,
        assignedTo: currentUser.id,
        status: "pending",
        dailyTarget: tpl.dailyTarget,
        progress: 0,
        stops: [],
        createdAt: new Date().toISOString(),
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">{t("myTasks")}</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">{currentUser.name}</p>
        </div>
        {canCreateTasks(currentUser) && (
          <button onClick={() => setShowCreate((o) => !o)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent">
            <Plus className="w-4 h-4" /> {t("add")}
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={createTask} className="p-5 rounded-xl border border-border bg-card space-y-3">
          <input name="title" placeholder={t("title")} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          <input name="description" placeholder={t("description")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          <input name="dailyTarget" type="number" min="1" defaultValue="1" placeholder={t("dailyGoal")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm">{t("save")}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-md border border-border text-sm">{t("cancel")}</button>
          </div>
        </form>
      )}

      {/* Templates */}
      {canCreateTasks(currentUser) && data.templates.length > 0 && (
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("templates")}</p>
          <div className="flex flex-wrap gap-2">
            {data.templates.map((tpl) => (
              <button key={tpl.id} onClick={() => applyTemplate(tpl)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-body hover:bg-muted">
                <Copy className="w-3 h-3" /> {tpl.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {myTasks.length === 0 ? (
        <p className="text-muted-foreground font-body">{t("noTasks")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myTasks.map((tk) => {
            const pct = Math.round((tk.progress / (tk.dailyTarget || 1)) * 100);
            return (
              <div key={tk.id} className="p-5 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-semibold text-lg">{tk.title}</h3>
                    <p className="text-xs text-muted-foreground font-body">{stationName(tk.stationId)}</p>
                  </div>
                  <StatusBadge status={tk.status} t={t} />
                </div>
                {tk.description && <p className="text-sm text-muted-foreground font-body">{tk.description}</p>}

                <div>
                  <div className="flex justify-between text-xs font-body mb-1">
                    <span className="text-muted-foreground">{t("dailyGoal")}: {tk.progress}/{tk.dailyTarget}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {tk.stops.length > 0 && (
                  <div className="text-xs text-muted-foreground font-body p-2 rounded bg-muted/50">
                    {tk.stops.map((s, i) => (
                      <p key={i}>⏸ {t(s.reason)}: {s.note || "—"}</p>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {tk.status === "pending" && (
                    <button onClick={() => claim(tk.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body">
                      <Play className="w-3.5 h-3.5" /> {t("claim")}
                    </button>
                  )}
                  {tk.status === "in_progress" && (
                    <>
                      <div className="flex items-center gap-1">
                        <input type="number" min="0" value={progress} onChange={(e) => setProgress(e.target.value)} placeholder="+" className="w-16 px-2 py-1.5 rounded-md border border-input text-xs font-body" />
                        <button onClick={() => logProgress(tk.id)} className="px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">{t("logProgress")}</button>
                      </div>
                      <button onClick={() => setActive(tk.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-destructive text-destructive text-xs font-body hover:bg-destructive/10">
                        <Pause className="w-3.5 h-3.5" /> {t("stopWork")}
                      </button>
                      <button onClick={() => complete(tk.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-body">
                        <Check className="w-3.5 h-3.5" /> {t("submit")}
                      </button>
                    </>
                  )}
                  {tk.status === "stopped" && (
                    <button onClick={() => resume(tk.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body">
                      <Play className="w-3.5 h-3.5" /> {t("resume")}
                    </button>
                  )}
                </div>

                {active === tk.id && (
                  <div className="p-3 rounded-md border border-border space-y-2 bg-muted/30">
                    <select value={stopReason} onChange={(e) => setStopReason(e.target.value)} className="w-full px-2 py-1.5 rounded-md border border-input text-xs font-body">
                      {STOP_REASONS.map((r) => <option key={r} value={r}>{t(r)}</option>)}
                    </select>
                    <input value={stopNote} onChange={(e) => setStopNote(e.target.value)} placeholder={t("note")} className="w-full px-2 py-1.5 rounded-md border border-input text-xs font-body" />
                    <button onClick={() => stop(tk.id)} className="px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-xs font-body">{t("stopWork")}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, t }) {
  const map = {
    pending: "bg-muted text-muted-foreground",
    in_progress: "bg-blue-100 text-blue-700",
    stopped: "bg-destructive/15 text-destructive",
    completed: "bg-accent/15 text-accent",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-body whitespace-nowrap ${map[status] || ""}`}>{t(status)}</span>;
}