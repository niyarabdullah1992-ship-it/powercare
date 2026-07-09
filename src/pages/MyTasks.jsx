import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { addNotification } from "@/lib/store";
import { canCreateTasks, canSeeAllStations, visibleStations } from "@/lib/permissions";
import { base44 } from "@/api/base44Client";
import { Plus, Check, Target, User, Users, Building2, Calendar, AlertTriangle, Paperclip, ListOrdered, FileText, ChevronRight, ArrowLeft, Radio } from "lucide-react";

const DATE_PRESETS = [
  { val: "monthly", months: 1 },
  { val: "6months", months: 6 },
  { val: "yearly", months: 12 },
  { val: "days", months: 0 },
  { val: "custom", months: 0 },
];

export default function MyTasks() {
  const { t, dir } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [assignType, setAssignType] = useState("member");
  const [formStation, setFormStation] = useState("");
  const [datePreset, setDatePreset] = useState("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [customDays, setCustomDays] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [logTarget, setLogTarget] = useState(null);
  const [logAmount, setLogAmount] = useState(1);
  const [targets, setTargets] = useState([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);

  const fetchTargets = async () => {
    if (!currentUser) return;
    setTargetsLoading(true);
    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "listTargets",
        userRole: currentUser.role,
        userId: currentUser.id,
        stationId: currentUser.stationId || null,
        managedStations: currentUser.managedStations || [],
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

  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";
  const employeeName = (id) => data.employees.find((e) => e.id === id)?.name || "—";

  const memberCandidates = formStation === "hq"
    ? data.employees.filter((e) => !e.stationId)
    : formStation
      ? data.employees.filter((e) => e.stationId === formStation)
      : data.employees;

  const computeDates = () => {
    const start = new Date();
    if (datePreset === "custom") {
      return {
        startDate: customStart ? new Date(customStart).toISOString() : start.toISOString(),
        endDate: customEnd ? new Date(customEnd).toISOString() : null,
      };
    }
    if (datePreset === "days") {
      const end = new Date(start);
      end.setDate(end.getDate() + Number(customDays || 1));
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    const months = DATE_PRESETS.find((p) => p.val === datePreset)?.months || 1;
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  const createTarget = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = fd.get("title");
    const description = fd.get("description") || "";
    const steps = fd.get("steps") || "";
    const total = Number(fd.get("totalTasks") || 1);
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

    const { startDate, endDate } = computeDates();
    if (!endDate) { alert(t("selectDate")); return; }

    let fileUrl = null;
    if (pdfFile) {
      setUploading(true);
      try {
        const up = await base44.integrations.Core.UploadFile({ file: pdfFile });
        fileUrl = up.file_url;
      } catch {
        alert("PDF upload failed");
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "createTarget",
        userRole: currentUser.role,
        managerId: currentUser.id,
        title,
        description,
        steps,
        fileUrl,
        taskTarget: total,
        assignmentType: aType,
        assignmentId,
        employeeId,
        stationId,
        startDate,
        endDate,
      });
      const created = res?.data?.target;
      if (created && created.id) {
        setTargets((prev) => [created, ...prev.filter((x) => x.id !== created.id)]);
      }
      if (aType === "member" && employeeId) {
        addNotification(company.id, employeeId, `${t("setTarget")}: ${title} — ${total} ${t("tasksUnit")}.`);
      }
      setShowCreate(false);
      setAssignType("member");
      setFormStation("");
      setDatePreset("monthly");
      setCustomStart("");
      setCustomEnd("");
      setCustomDays("");
      setPdfFile(null);
      fetchTargets();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to create");
    }
  };

  const logCompleted = async (targetId) => {
    const amt = Number(logAmount) || 0;
    if (amt <= 0) return;
    const tg = targets.find((x) => x.id === targetId);
    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "updateProgress",
        targetId,
        amount: amt,
        userId: currentUser.id,
        managerId: data.directorId,
        employeeName: currentUser.name,
      });
      // Instant notification to the responsible manager (target creator)
      const mgrId = tg?.manager_id || data.directorId;
      const newCompleted = res?.data?.target?.completed_tasks ?? (tg?.completed_tasks || 0) + amt;
      addNotification(
        company.id,
        mgrId,
        `${currentUser.name} → ${tg?.title || t("setTarget")}: +${amt} ${t("tasksUnit")} (${newCompleted}/${tg?.task_target || "?"}).`
      );
      setLogTarget(null);
      setLogAmount(1);
      fetchTargets();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to update progress");
    }
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

  const presetLabel = (val) => ({
    monthly: t("presetMonthly"),
    "6months": t("preset6Months"),
    yearly: t("presetYearly"),
    days: t("presetDays"),
    custom: t("presetCustom"),
  })[val] || val;

  // Group targets by station
  const empStation = (id) => data.employees.find((e) => e.id === id)?.stationId || null;
  const targetStationKey = (tg) => {
    if (tg.assignment_type === "station_team") return tg.assignment_id || tg.station_id || "unassigned";
    if (tg.assignment_type === "member") return tg.station_id || empStation(tg.employee_id) || "unassigned";
    if (tg.assignment_type === "hq_team") return "hq";
    return tg.station_id || "unassigned";
  };
  const groupMap = {};
  for (const tg of targets) {
    const key = targetStationKey(tg);
    if (!groupMap[key]) groupMap[key] = { key, count: 0 };
    groupMap[key].count++;
  }
  const seesAll = canSeeAllStations(currentUser);
  const visible = visibleStations(currentUser, data);
  const showHq = seesAll;
  const stationGroups = [
    ...(showHq ? [{ key: "hq", name: t("hq"), count: groupMap["hq"]?.count || 0 }] : []),
    ...visible.map((s) => ({ key: s.id, name: s.name, count: groupMap[s.id]?.count || 0 })),
  ];
  const stationTargets = selectedStation ? targets.filter((tg) => targetStationKey(tg) === selectedStation) : [];
  const selectedStationName = selectedStation === "hq" ? t("hq") : stationName(selectedStation);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">{t("myTasks")}</h1>
        </div>
        {canCreateTasks(currentUser) && (
          <button onClick={() => setShowCreate((o) => !o)} disabled={uploading} className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent disabled:opacity-50">
            <Plus className="w-4 h-4" /> {uploading ? "…" : t("newTaskTarget")}
          </button>
        )}
      </div>

      {/* Unified Target form */}
      {showCreate && canCreateTasks(currentUser) && (
        <form onSubmit={createTarget} className="p-5 rounded-xl border border-border bg-card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="title" placeholder={t("taskTitle")} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
            <input name="description" placeholder={t("taskDescription")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          </div>

          {/* Steps */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><ListOrdered className="w-3.5 h-3.5" /> {t("steps")}</p>
            <textarea name="steps" rows={3} placeholder={t("stepsPlaceholder")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body resize-y" />
          </div>

          {/* PDF attachment */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> {t("attachPdf")}</p>
            <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="w-full text-xs font-body file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-foreground file:text-background file:cursor-pointer" />
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
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("totalTasks")}</p>
            <input name="totalTasks" type="number" min="1" defaultValue="50" required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          </div>

          {/* Date preset selector */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {t("selectDate")}</p>
            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map(({ val }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDatePreset(val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${datePreset === val ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
                >
                  {presetLabel(val)}
                </button>
              ))}
            </div>
          </div>

          {datePreset === "days" && (
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">{t("presetDays")}</label>
              <input type="number" min="1" value={customDays} onChange={(e) => setCustomDays(e.target.value)} placeholder={t("numberOfDays")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
            </div>
          )}

          {datePreset === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-body block mb-1">{t("startDate")}</label>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-body block mb-1">{t("endDate")}</label>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-body">{t("save")}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-md border border-border text-sm font-body">{t("cancel")}</button>
          </div>
        </form>
      )}

      {/* Task Targets — organized by station */}
      <div className="p-5 rounded-xl border border-border bg-card space-y-4">
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
          <Target className="w-4 h-4" /> {t("targets")}
        </h2>

        {targetsLoading ? (
          <p className="text-sm text-muted-foreground font-body">…</p>
        ) : !selectedStation ? (
          targets.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">{t("noTargets")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stationGroups.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setSelectedStation(g.key)}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:bg-muted transition text-start"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-foreground/5 flex items-center justify-center">
                      {g.key === "hq" ? <Building2 className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium font-body">{g.name}</p>
                      <p className="text-xs text-muted-foreground font-body">{g.count} {t("tasksUnit")}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground ${dir === "rtl" ? "rotate-180" : ""}`} />
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-3">
            <button onClick={() => setSelectedStation(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground font-body hover:text-foreground">
              <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} /> {t("back")}
            </button>
            <p className="font-heading text-base font-semibold">{selectedStationName}</p>
            {stationTargets.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body">{t("noTargets")}</p>
            ) : (
              <div className="space-y-3">
                {stationTargets.map((tg) => {
                  const pct = Math.min(Math.round((tg.completed_tasks / tg.task_target) * 100), 100);
                  const daysLeft = Math.ceil((new Date(tg.end_date).getTime() - Date.now()) / 86400000);
                  const done = tg.status === "completed";
                  const overdue = tg.status === "overdue";
                  const canLogThis = canLog(tg);
                  return (
                    <div key={tg.id} className="p-4 rounded-lg border border-border bg-background space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium font-body">{tg.title || `${t("setTarget")}`}</p>
                          {tg.description && <p className="text-xs text-muted-foreground font-body mt-0.5">{tg.description}</p>}
                          {tg.steps && (
                            <div className="text-xs text-muted-foreground font-body mt-1 p-2 rounded bg-muted/50 whitespace-pre-wrap">
                              <span className="font-medium">{t("steps")}:</span>{"\n"}{tg.steps}
                            </div>
                          )}
                          {tg.file_url && (
                            <a href={tg.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent font-body mt-1 hover:underline">
                              <FileText className="w-3.5 h-3.5" /> PDF
                            </a>
                          )}
                          <p className="text-xs text-muted-foreground font-body mt-1">{assignmentLabel(tg)}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-body whitespace-nowrap ${done ? "bg-accent/15 text-accent" : overdue ? "bg-destructive/15 text-destructive flex items-center gap-1" : "bg-muted text-muted-foreground"}`}>
                          {done ? t("targetDone") : overdue ? <><AlertTriangle className="w-3 h-3" /> {t("overdue")}</> : `${t("daysLeft")}: ${daysLeft}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-body mb-1">
                        <span className="text-muted-foreground">{t("completedCount")}: {tg.completed_tasks}/{tg.task_target} {t("tasksUnit")}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full transition-all ${done ? "bg-accent" : overdue ? "bg-destructive" : "bg-accent"}`} style={{ width: `${pct}%` }} />
                      </div>
                      {canLogThis && !done && !overdue && (
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
        )}
      </div>
    </div>
  );
}