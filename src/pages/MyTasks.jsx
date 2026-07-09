import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { addNotification } from "@/lib/store";
import { canCreateTasks, canSeeAllStations, visibleStations } from "@/lib/permissions";
import { base44 } from "@/api/base44Client";
import { Plus, Check, Target, User, Users, Building2, Calendar, AlertTriangle, Paperclip, ListOrdered, FileText, ChevronRight, ArrowLeft, Radio, MessageCircle, Send, Clock, Search, Pencil, Trash2, X } from "lucide-react";
import TaskStats from "@/components/tasks/TaskStats";

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
  const [commentsOpen, setCommentsOpen] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [targets, setTargets] = useState([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [priority, setPriority] = useState("medium");
  const [sortBy, setSortBy] = useState("priority");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editTarget, setEditTarget] = useState(null);

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

  // Auto-escalation: notify higher-level managers when an urgent task is at risk
  useEffect(() => {
    if (!data || !currentUser || !company) return;
    if (!canCreateTasks(currentUser)) return;
    const now = Date.now();
    for (const tg of targets) {
      if (tg.priority !== "urgent" || tg.status !== "active") continue;
      const totalDur = new Date(tg.end_date).getTime() - new Date(tg.start_date).getTime();
      const elapsed = now - new Date(tg.start_date).getTime();
      const timePct = totalDur > 0 ? (elapsed / totalDur) * 100 : 0;
      const progressPct = tg.task_target > 0 ? (tg.completed_tasks / tg.task_target) * 100 : 0;
      if (timePct > 75 && progressPct < 50) {
        const escKey = `powercare_esc_${tg.id}`;
        if (localStorage.getItem(escKey)) continue;
        localStorage.setItem(escKey, "1");
        const chain = ["station_manager", "pgm", "ops_manager", "director"];
        for (const role of chain) {
          for (const h of (data.employees || []).filter((e) => e.role === role)) {
            addNotification(company.id, h.id, `⚠️ ${t("urgent")}: "${tg.title}" — ${t("atRisk")}.`);
          }
        }
      }
    }
  }, [targets, data, currentUser, company]);

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
        priority,
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
      setPriority("medium");
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

  const submitComment = async (targetId) => {
    const text = commentText.trim();
    if (!text) return;
    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "addComment",
        targetId,
        userId: currentUser.id,
        userName: currentUser.name,
        content: text,
      });
      const updated = res?.data?.comments || [];
      setTargets((prev) => prev.map((x) => (x.id === targetId ? { ...x, comments: updated } : x)));
      setCommentText("");
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to add comment");
    }
  };

  const deleteTarget = async (targetId) => {
    if (!confirm(t("confirmDeleteTask"))) return;
    try {
      await base44.functions.invoke("supabaseTargets", { action: "deleteTarget", targetId });
      setTargets((prev) => prev.filter((x) => x.id !== targetId));
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to delete");
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "updateTarget",
        userRole: currentUser.role,
        targetId: editTarget.id,
        title: fd.get("title"),
        description: fd.get("description"),
        steps: fd.get("steps"),
        priority: fd.get("priority"),
        endDate: fd.get("endDate"),
        taskTarget: fd.get("totalTasks"),
      });
      const updated = res?.data?.target;
      if (updated) {
        setTargets((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      }
      setEditTarget(null);
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to update");
    }
  };

  const canManage = (tg) => canCreateTasks(currentUser) && (tg.manager_id === currentUser.id || canSeeAllStations(currentUser));

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
  const PRIORITY_WEIGHT = { urgent: 0, high: 1, medium: 2, low: 3 };
  const stationTargets = selectedStation
    ? targets
        .filter((tg) => targetStationKey(tg) === selectedStation)
        .filter((tg) => {
          if (statusFilter !== "all" && tg.status !== statusFilter) return false;
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (tg.title || "").toLowerCase().includes(q) || (tg.description || "").toLowerCase().includes(q);
          }
          return true;
        })
        .sort((a, b) => {
          if (sortBy === "priority") {
            return (PRIORITY_WEIGHT[a.priority] ?? 2) - (PRIORITY_WEIGHT[b.priority] ?? 2);
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
    : [];
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

      {/* Statistics overview */}
      {!targetsLoading && targets.length > 0 && <TaskStats targets={targets} t={t} />}

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

          {/* Priority */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {t("priority")}</p>
            <div className="flex flex-wrap gap-2">
              {[
                { val: "urgent", label: t("urgent") },
                { val: "high", label: t("high") },
                { val: "medium", label: t("medium") },
                { val: "low", label: t("low") },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPriority(val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${priority === val ? "bg-foreground text-background border-foreground" : val === "urgent" ? "border-red-400 text-red-700 hover:bg-red-50" : "border-border hover:bg-muted"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

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
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="font-heading text-base font-semibold">{selectedStationName}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-body">{t("sortBy")}:</span>
                <button onClick={() => setSortBy("priority")} className={`px-2.5 py-1 rounded-full text-xs font-body border transition ${sortBy === "priority" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>{t("byPriority")}</button>
                <button onClick={() => setSortBy("date")} className={`px-2.5 py-1 rounded-full text-xs font-body border transition ${sortBy === "date" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>{t("byNewest")}</button>
              </div>
            </div>
            {/* Search + status filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className={`absolute top-1/2 -translate-y-1/2 ${dir === "rtl" ? "right-3" : "left-3"} w-4 h-4 text-muted-foreground`} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchTasks")}
                  className={`w-full ${dir === "rtl" ? "pr-9 pl-3" : "pl-9 pr-3"} py-2 rounded-md border border-input text-sm font-body`}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-md border border-input text-sm font-body bg-card"
              >
                <option value="all">{t("allStatuses")}</option>
                <option value="active">{t("inProgress")}</option>
                <option value="completed">{t("completed")}</option>
                <option value="overdue">{t("overdue")}</option>
              </select>
            </div>
            {stationTargets.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body">{searchQuery || statusFilter !== "all" ? t("noResults") : t("noTargets")}</p>
            ) : (
              <div className="space-y-3">
                {stationTargets.map((tg) => {
                  const pct = Math.min(Math.round((tg.completed_tasks / tg.task_target) * 100), 100);
                  const daysLeft = Math.ceil((new Date(tg.end_date).getTime() - Date.now()) / 86400000);
                  const done = tg.status === "completed";
                  const overdue = tg.status === "overdue";
                  const canLogThis = canLog(tg);
                  const isUrgent = tg.priority === "urgent";
                  const totalDur = new Date(tg.end_date).getTime() - new Date(tg.start_date).getTime();
                  const elapsed = Date.now() - new Date(tg.start_date).getTime();
                  const timePct = totalDur > 0 ? (elapsed / totalDur) * 100 : 0;
                  const progressPct = tg.task_target > 0 ? (tg.completed_tasks / tg.task_target) * 100 : 0;
                  const atRisk = isUrgent && !done && !overdue && timePct > 75 && progressPct < 50;
                  const statusBadge = done
                    ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                    : overdue
                    ? "bg-red-100 text-red-700 border-red-300"
                    : "bg-amber-100 text-amber-700 border-amber-300";
                  const cardBorder = overdue
                    ? "border-red-300 bg-red-50/40"
                    : done
                    ? "border-emerald-300 bg-emerald-50/30"
                    : isUrgent
                    ? "border-red-400 bg-red-50/20"
                    : "border-border bg-background";
                  const barColor = done
                    ? "bg-emerald-500"
                    : overdue
                    ? "bg-red-500"
                    : pct >= 67
                    ? "bg-emerald-500"
                    : pct >= 34
                    ? "bg-amber-500"
                    : "bg-yellow-400";
                  return (
                    <div key={tg.id} className={`p-4 rounded-lg border space-y-3 transition-colors ${cardBorder}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
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
                        <div className="flex flex-col items-end gap-1">
                          {isUrgent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-medium border border-red-500 bg-red-100 text-red-700 whitespace-nowrap">
                              <AlertTriangle className="w-3 h-3" /> {t("urgent")}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-body font-medium border whitespace-nowrap ${statusBadge}`}>
                            {done ? <Check className="w-3 h-3" /> : overdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {done ? t("completed") : overdue ? t("overdue") : t("inProgress")}
                          </span>
                          {canManage(tg) && (
                            <div className="flex items-center gap-1 mt-1">
                              <button onClick={() => setEditTarget(tg)} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title={t("edit")}>
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteTarget(tg.id)} className="p-1 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600" title={t("delete")}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-body">
                        {done ? (
                          <span className="text-emerald-600 font-medium">{t("targetDone")}</span>
                        ) : overdue ? (
                          <span className="text-red-600 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t("overdue")}</span>
                        ) : atRisk ? (
                          <span className="text-red-600 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t("atRisk")}</span>
                        ) : (
                          <span className={`flex items-center gap-1 ${daysLeft <= 3 ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            <Clock className="w-3 h-3" /> {t("daysLeft")}: {daysLeft}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-body mb-1">
                          <span className="text-muted-foreground">{t("completedCount")}: {tg.completed_tasks}/{tg.task_target} {t("tasksUnit")}</span>
                          <span className="font-medium">{pct}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      {canLogThis && !done && !overdue && (
                        <div className="flex items-center gap-2 pt-1">
                          <input type="number" min="1" value={logTarget === tg.id ? logAmount : 1} onChange={(e) => { setLogTarget(tg.id); setLogAmount(e.target.value); }} className="w-20 px-2 py-1.5 rounded-md border border-input text-xs font-body" />
                          <button onClick={() => logCompleted(tg.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-body">
                            <Check className="w-3.5 h-3.5" /> {t("logCompleted")}
                          </button>
                        </div>
                      )}

                      <div className="pt-2 border-t border-border">
                        <button onClick={() => { const next = commentsOpen === tg.id ? null : tg.id; setCommentsOpen(next); setCommentText(""); }} className="flex items-center gap-1.5 text-xs text-muted-foreground font-body hover:text-foreground">
                          <MessageCircle className="w-3.5 h-3.5" /> {t("comments")} ({Array.isArray(tg.comments) ? tg.comments.length : 0})
                        </button>
                        {commentsOpen === tg.id && (
                          <div className="mt-2 space-y-2">
                            {Array.isArray(tg.comments) && tg.comments.length > 0 && (
                              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {tg.comments.map((c) => (
                                  <div key={c.id} className="text-xs font-body p-2 rounded-md bg-muted/50">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium text-foreground">{c.user_name}</p>
                                      <span className="text-[10px] text-muted-foreground">{c.created_at ? new Date(c.created_at).toLocaleString() : ""}</span>
                                    </div>
                                    <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">{c.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={t("writeComment")} className="flex-1 px-2 py-1.5 rounded-md border border-input text-xs font-body" />
                              <button onClick={() => submitComment(tg.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-foreground text-background text-xs font-body">
                                <Send className="w-3.5 h-3.5" /> {t("send")}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setEditTarget(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={saveEdit} className="w-full max-w-lg p-5 rounded-xl border border-border bg-card space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold flex items-center gap-2"><Pencil className="w-4 h-4" /> {t("editTask")}</h3>
              <button type="button" onClick={() => setEditTarget(null)} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <input name="title" defaultValue={editTarget.title || ""} placeholder={t("taskTitle")} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
            <input name="description" defaultValue={editTarget.description || ""} placeholder={t("taskDescription")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
            <textarea name="steps" rows={3} defaultValue={editTarget.steps || ""} placeholder={t("stepsPlaceholder")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body resize-y" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-body block mb-1">{t("priority")}</label>
                <select name="priority" defaultValue={editTarget.priority || "medium"} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body bg-card">
                  <option value="urgent">{t("urgent")}</option>
                  <option value="high">{t("high")}</option>
                  <option value="medium">{t("medium")}</option>
                  <option value="low">{t("low")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-body block mb-1">{t("totalTasks")}</label>
                <input name="totalTasks" type="number" min="1" defaultValue={editTarget.task_target || 1} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">{t("endDate")}</label>
              <input name="endDate" type="date" defaultValue={editTarget.end_date ? new Date(editTarget.end_date).toISOString().slice(0, 10) : ""} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-body">{t("update")}</button>
              <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 rounded-md border border-border text-sm font-body">{t("cancel")}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}