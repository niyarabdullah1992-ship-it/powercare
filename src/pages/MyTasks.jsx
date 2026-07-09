import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, addNotification } from "@/lib/store";
import { canCreateTasks } from "@/lib/permissions";
import { base44 } from "@/api/base44Client";
import { Play, Pause, Check, Plus, Copy, Target, User, Users, Building2 } from "lucide-react";

const STOP_REASONS = ["weather", "equipment", "power", "access", "labor"];

export default function MyTasks() {
  const { t } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [active, setActive] = useState(null);
  const [progress, setProgress] = useState(0);
  const [stopReason, setStopReason] = useState("equipment");
  const [stopNote, setStopNote] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [assignType, setAssignType] = useState("member");
  const [formStation, setFormStation] = useState("");
  const [logTarget, setLogTarget] = useState(null);
  const [logAmount, setLogAmount] = useState(1);
  const [targets, setTargets] = useState([]);
  const [targetsLoading, setTargetsLoading] = useState(false);

  const fetchTargets = async () => {
    if (!currentUser) return;
    setTargetsLoading(true);
    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "listTargets",
        userRole: currentUser.role,
        userId: currentUser.id,
        stationId: currentUser.stationId || null,
      });
      setTargets(res.data.targets || []);
    } catch {
      setTargets([]);
    } finally {
      setTargetsLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [currentUser?.id]);

  if (!data || !currentUser) return null;

  const myTasks = data.tasks.filter((tk) => tk.assignedTo === currentUser.id);
  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";
  const employeeName = (id) => data.employees.find((e) => e.id === id)?.name || "—";
  const empStation = (id) => data.employees.find((e) => e.id === id)?.stationId || null;

  const visibleTargets = targets;

  // employees available for member assignment, filtered by selected station (or HQ)
  const memberCandidates = formStation === "hq"
    ? data.employees.filter((e) => !e.stationId)
    : formStation
      ? data.employees.filter((e) => e.stationId === formStation)
      : data.employees;

  const createUnified = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = fd.get("title");
    const description = fd.get("description") || "";
    const total = Number(fd.get("totalTasks") || 1);
    const days = Number(fd.get("days") || 1);
    const aType = fd.get("assignType") || "member";

    let employeeId = null;
    let assignmentId = null;
    let stationId = null;

    if (aType === "member") {
      employeeId = fd.get("assignedTo");
      if (!employeeId) { alert(t("selectEmployee")); return; }
      const emp = data.employees.find((x) => x.id === employeeId);
      stationId = emp?.stationId || null;
      assignmentId = employeeId;
    } else if (aType === "station_team") {
      stationId = fd.get("stationId");
      if (!stationId) { alert(t("selectStation")); return; }
      assignmentId = stationId;
    }

    try {
      await base44.functions.invoke("supabaseTargets", {
        action: "createTarget",
        userRole: currentUser.role,
        managerId: currentUser.id,
        title,
        description,
        taskTarget: total,
        days,
        assignmentType: aType,
        assignmentId,
        employeeId,
        stationId,
      });
      if (aType === "member" && employeeId) {
        addNotification(company.id, employeeId, `${t("setTarget")}: ${title} — ${total} ${t("tasksUnit")} / ${days} ${t("numberOfDays").toLowerCase()}.`);
      }
      setShowCreate(false);
      setAssignType("member");
      setFormStation("");
      fetchTargets();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to create");
    }
  };

  const logCompleted = async (targetId) => {
    const amt = Number(logAmount) || 0;
    if (amt <= 0) return;
    try {
      await base44.functions.invoke("supabaseTargets", {
        action: "updateProgress",
        targetId,
        amount: amt,
        userId: currentUser.id,
        managerId: data.directorId,
        employeeName: currentUser.name,
      });
      addNotification(company.id, data.directorId, `${currentUser.name} ${t("completedCount").toLowerCase()}: +${amt} ${t("tasksUnit")}.`);
      setLogTarget(null);
      setLogAmount(1);
      fetchTargets();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to update progress");
    }
  };

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

  const assignmentLabel = (tg) => {
    if (tg.assignment_type === "member") return `${t("member")}: ${employeeName(tg.employee_id)}`;
    if (tg.assignment_type === "station_team") return `${t("stationTeam")}: ${stationName(tg.assignment_id)}`;
    if (tg.assignment_type === "hq_team") return t("hqTeam");
    return employeeName(tg.employee_id);
  };

  const canLog = (tg) => {
    if (tg.assignment_type === "member") return tg.employee_id === currentUser.id;
    if (tg.assignment_type === "station_team") return tg.assignment_id === currentUser.stationId;
    if (tg.assignment_type === "hq_team") return !currentUser.stationId;
    return tg.employee_id === currentUser.id;
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
            <Plus className="w-4 h-4" /> {t("newTaskTarget")}
          </button>
        )}
      </div>

      {/* Unified Task + Target form */}
      {showCreate && canCreateTasks(currentUser) && (
        <form onSubmit={createUnified} className="p-5 rounded-xl border border-border bg-card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="title" placeholder={t("taskTitle")} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
            <input name="description" placeholder={t("taskDescription")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          </div>

          {/* Assignment type selector */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("assignTo")}</p>
            <div className="flex flex-wrap gap-2">
              {[
                { val: "member", label: t("member"), icon: User },
                { val: "station_team", label: t("stationTeam"), icon: Users },
                { val: "hq_team", label: t("hqTeam"), icon: Building2 },
              ].map(({ val, label, icon: Icon }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setAssignType(val); setFormStation(""); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${assignType === val ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
            <input type="hidden" name="assignType" value={assignType} />
          </div>

          {/* Conditional assignment fields */}
          {assignType === "member" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={formStation} onChange={(e) => setFormStation(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body">
                <option value="">{t("all")}</option>
                <option value="hq">{t("hq")}</option>
                {data.stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select name="assignedTo" required defaultValue="" className="px-3 py-2 rounded-md border border-input text-sm font-body">
                <option value="" disabled>{t("selectEmployee")}</option>
                {memberCandidates.filter((e) => e.role === "employee" || e.role === "station_manager").map((e) => (
                  <option key={e.id} value={e.id}>{e.name} — {e.stationId ? stationName(e.stationId) : t("hq")}</option>
                ))}
              </select>
            </div>
          )}

          {assignType === "station_team" && (
            <select name="stationId" required defaultValue="" className="w-full px-3 py-2 rounded-md border border-input text-sm font-body">
              <option value="" disabled>{t("selectStation")}</option>
              {data.stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          {assignType === "hq_team" && (
            <p className="text-xs text-muted-foreground font-body">{t("hqTeamNote")}</p>
          )}

          {/* Target quota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="totalTasks" type="number" min="1" defaultValue="30" placeholder={t("totalTasks")} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
            <input name="days" type="number" min="1" defaultValue="10" placeholder={t("numberOfDays")} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-body">{t("save")}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-md border border-border text-sm font-body">{t("cancel")}</button>
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

      {/* Task Targets */}
      <div className="p-5 rounded-xl border border-border bg-card space-y-4">
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
          <Target className="w-4 h-4" /> {t("targets")}
        </h2>

        {targetsLoading ? (
          <p className="text-sm text-muted-foreground font-body">…</p>
        ) : visibleTargets.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">{t("noTargets")}</p>
        ) : (
          <div className="space-y-3">
            {visibleTargets.map((tg) => {
              const pct = Math.min(Math.round((tg.completed_tasks / tg.task_target) * 100), 100);
              const daysLeft = Math.ceil((new Date(tg.end_date).getTime() - Date.now()) / 86400000);
              const done = tg.status === "completed";
              const canLogThis = canLog(tg);
              return (
                <div key={tg.id} className="p-4 rounded-lg border border-border bg-background space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium font-body">{tg.title || `${t("setTarget")}`}</p>
                      {tg.description && <p className="text-xs text-muted-foreground font-body mt-0.5">{tg.description}</p>}
                      <p className="text-xs text-muted-foreground font-body mt-1">{assignmentLabel(tg)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-body whitespace-nowrap ${done ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                      {done ? t("targetDone") : `${t("daysLeft")}: ${daysLeft}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-body mb-1">
                    <span className="text-muted-foreground">{t("completedCount")}: {tg.completed_tasks}/{tg.task_target} {t("tasksUnit")}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  {canLogThis && !done && (
                    <div className="flex items-center gap-2 pt-1">
                      <input type="number" min="1" value={logTarget === tg.id ? logAmount : 1} onChange={(e) => { setLogTarget(tg.id); setLogAmount(e.target.value); }} className="w-20 px-2 py-1.5 rounded-md border border-input text-xs font-body" />
                      <button onClick={() => logCompleted(tg.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-body">
                        <Check className="w-3.5 h-3.5" /> {t("logCompleted")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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