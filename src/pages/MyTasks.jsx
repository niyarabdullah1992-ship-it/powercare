import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext } from "@hello-pangea/dnd";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { addNotification, addPoints } from "@/lib/store";
import { canCreateTasks, canSeeAllStations, visibleStations } from "@/lib/permissions";
import { PRIORITY_POINTS } from "@/lib/rewards";
import { groupLevelsByOrder } from "@/lib/hrLevels";
import { handlersForLevel, buildEscalationSteps } from "@/lib/escalation";
import { base44 } from "@/api/base44Client";
import { getParentPath, withAncestors, NO_SECTION } from "@/lib/taskFolders";
import { logAudit } from "@/lib/auditLog";
import { getTodayAttendance, isCheckedIn } from "@/lib/attendance";
import { Link } from "react-router-dom";
import { Plus, Check, Target, User, Users, Building2, Calendar, AlertTriangle, Paperclip, ListOrdered, FileText, ChevronRight, ArrowLeft, Radio, Clock, Search, Pencil, X, ClipboardCheck } from "lucide-react";
import StationCombobox from "@/components/stations/StationCombobox";
import TaskStats from "@/components/tasks/TaskStats";
import TaskCard from "@/components/tasks/TaskCard";
import FolderTree from "@/components/tasks/FolderTree";
import SectionPicker from "@/components/tasks/SectionPicker";
import CommentFiles from "@/components/tasks/CommentFiles";
import VoiceRecorder from "@/components/tasks/VoiceRecorder";
import EscalationInfoBox from "@/components/escalation/EscalationInfoBox";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import MobileSelect from "@/components/mobile/MobileSelect";
import PageHeader from "@/components/PageHeader";
import { queryClientInstance } from "@/lib/query-client";

const DATE_PRESETS = [
  { val: "monthly", months: 1 },
  { val: "3months", months: 3 },
  { val: "6months", months: 6 },
  { val: "yearly", months: 12 },
  { val: "days", months: 0 },
  { val: "custom", months: 0 },
];

const PRIORITY_WEIGHT = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function MyTasks() {
  const { t, dir, lang } = useI18n();
  const { data, currentUser, company, refresh } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [assignType, setAssignType] = useState("member");
  const [formStation, setFormStation] = useState("");
  const [datePreset, setDatePreset] = useState("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [customDays, setCustomDays] = useState("");
  const [taskFiles, setTaskFiles] = useState([]);
  const [logTarget, setLogTarget] = useState(null);
  const [logAmount, setLogAmount] = useState(1);
  const [logProofFiles, setLogProofFiles] = useState([]);
  const [commentsOpen, setCommentsOpen] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentFiles, setCommentFiles] = useState([]);
  const [markIssue, setMarkIssue] = useState(false);
  const [targets, setTargets] = useState([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [folderPath, setFolderPath] = useState(null);
  const [priority, setPriority] = useState("medium");
  const [sortBy, setSortBy] = useState("priority");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editTarget, setEditTarget] = useState(null);
  const [folders, setFolders] = useState([]);
  const [sectionValue, setSectionValue] = useState("");
  const [checkedInToday, setCheckedInToday] = useState(true);

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

  // Task actions are gated on today's attendance being checked in (see src/lib/attendance.js).
  useEffect(() => {
    if (!currentUser) return;
    getTodayAttendance(currentUser.id).then((att) => setCheckedInToday(isCheckedIn(att)));
  }, [currentUser?.id]);

  const fetchFolders = async () => {
    try {
      const res = await base44.functions.invoke("supabaseTargets", { action: "listFolders" });
      setFolders(res.data.folders || []);
    } catch {
      setFolders([]);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  // Re-tapping the Tasks bottom tab resets the station/folder browser to root.
  useEffect(() => {
    const onReset = (e) => {
      if (e.detail === "/app/tasks") { setSelectedStation(null); setFolderPath(null); }
    };
    window.addEventListener("powercare:tab-reset", onReset);
    return () => window.removeEventListener("powercare:tab-reset", onReset);
  }, []);

  const addFolderAt = async (parentPath, name) => {
    if (!selectedStation) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const path = parentPath ? `${parentPath}/${trimmed}` : trimmed;
    if (folders.some((f) => f.station_id === selectedStation && f.path === path)) {
      alert(t("sectionAlreadyExists") || "This section already exists.");
      return;
    }
    const sortOrder = folders.filter((f) => f.station_id === selectedStation && getParentPath(f.path) === parentPath).length;
    try {
      const res = await base44.functions.invoke("supabaseTargets", { action: "createFolder", stationId: selectedStation, path, sortOrder });
      const created = res?.data?.folder;
      if (created) setFolders((prev) => [...prev, created]);
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || "Failed to create section");
    }
  };

  // Ensures a folder exists for a section path so a task assigned to a brand-new,
  // free-typed section name actually shows up in the folder tree instead of vanishing.
  const ensureFolder = async (path, forStationId) => {
    if (!path || !forStationId) return;
    if (folders.some((f) => f.station_id === forStationId && f.path === path)) return;
    const parentPath = getParentPath(path);
    const sortOrder = folders.filter((f) => f.station_id === forStationId && getParentPath(f.path) === parentPath).length;
    try {
      const res = await base44.functions.invoke("supabaseTargets", { action: "createFolder", stationId: forStationId, path, sortOrder });
      const created = res?.data?.folder;
      if (created) setFolders((prev) => [...prev, created]);
    } catch {
      // best-effort — folder will still be usable via the existing sections list
    }
  };

  const moveTaskToSection = async (tg, newSectionKey) => {
    const section = newSectionKey === NO_SECTION ? "" : newSectionKey;
    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "updateTarget",
        userRole: currentUser.role,
        targetId: tg.id,
        section,
      });
      const updated = res?.data?.target;
      if (updated) {
        setTargets((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      }
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to move task");
    }
  };

  const renameFolder = async (oldPath, newName) => {
    const parent = getParentPath(oldPath);
    const newPath = parent ? `${parent}/${newName}` : newName;
    const affectedTasks = targets.filter((tg) => targetStationKey(tg) === selectedStation && (tg.section === oldPath || (tg.section || "").startsWith(`${oldPath}/`)));
    try {
      await Promise.all(
        affectedTasks.map((tg) =>
          base44.functions.invoke("supabaseTargets", {
            action: "updateTarget",
            userRole: currentUser.role,
            targetId: tg.id,
            section: tg.section === oldPath ? newPath : newPath + tg.section.slice(oldPath.length),
          })
        )
      );
      await base44.functions.invoke("supabaseTargets", {
        action: "renameFolder",
        stationId: selectedStation,
        oldPath,
        newPath,
      });
      fetchTargets();
      fetchFolders();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to rename folder");
    }
  };

  const deleteFolder = async (folderPath) => {
    const affectedTasks = targets.filter((tg) => targetStationKey(tg) === selectedStation && (tg.section === folderPath || (tg.section || "").startsWith(`${folderPath}/`)));
    try {
      await Promise.all(
        affectedTasks.map((tg) =>
          base44.functions.invoke("supabaseTargets", {
            action: "updateTarget",
            userRole: currentUser.role,
            targetId: tg.id,
            section: "",
          })
        )
      );
      await base44.functions.invoke("supabaseTargets", {
        action: "deleteFolder",
        stationId: selectedStation,
        path: folderPath,
      });
      fetchTargets();
      fetchFolders();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to delete folder");
    }
  };

  const reorderChildren = async (parentPath, ids) => {
    const items = ids.map((id, idx) => ({ id, sortOrder: idx }));
    setFolders((prev) => prev.map((f) => {
      const match = items.find((it) => it.id === f.id);
      return match ? { ...f, sort_order: match.sortOrder } : f;
    }));
    try {
      await base44.functions.invoke("supabaseTargets", { action: "reorderFolders", items });
    } catch {
      // best-effort — order will re-sync on next fetch
    }
  };

  // Single drag-and-drop handler for the flat folder browser: reordering sibling
  // folder cards, and dragging a task card onto a folder card or breadcrumb crumb
  // (including "Home") to move it there.
  const handleTreeDragEnd = (result) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;

    if (type === "FOLDER") {
      if (source.droppableId !== destination.droppableId || source.index === destination.index) return;
      const parentKey = source.droppableId.replace(/^folders-/, "");
      const parentPath = parentKey === "root" ? null : parentKey;
      const siblings = folders
        .filter((f) => f.station_id === selectedStation && getParentPath(f.path) === parentPath)
        .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
      const reordered = Array.from(siblings);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      reorderChildren(parentPath, reordered.map((f) => f.id));
      return;
    }

    if (type === "TASK") {
      let destPath = null;
      if (destination.droppableId.startsWith("foldercard-")) {
        destPath = destination.droppableId.replace(/^foldercard-/, "");
      } else if (destination.droppableId.startsWith("crumb-")) {
        const key = destination.droppableId.replace(/^crumb-/, "");
        destPath = key === "root" ? null : key;
      } else {
        return; // dropped back into the same tasks list — no-op
      }
      const taskId = draggableId.replace(/^task::/, "");
      const tg = targets.find((x) => x.id === taskId);
      if (!tg) return;
      if ((tg.section || null) === destPath) return;
      moveTaskToSection(tg, destPath || NO_SECTION);
    }
  };

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
    const section = fd.get("section") || "";
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

    const fileUrls = taskFiles.length > 0 ? taskFiles.map((f) => ({ url: f.url, name: f.name, type: f.type })) : null;

    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "createTarget",
        userRole: currentUser.role,
        managerId: currentUser.id,
        title,
        description,
        steps,
        section,
        fileUrls,
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
      if (section) {
        ensureFolder(section, aType === "hq_team" ? "hq" : stationId);
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
      setTaskFiles([]);
      setPriority("medium");
      setSectionValue("");
      fetchTargets();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to create");
    }
  };

  const logCompleted = async (targetId) => {
    if (!checkedInToday) { alert(t("mustCheckInFirst")); return; }
    const amt = Number(logAmount) || 0;
    if (amt <= 0) return;
    const tg = targets.find((x) => x.id === targetId);
    // Optimistic update: reflect the new progress immediately, roll back on failure.
    const prevSnapshot = tg ? { ...tg } : null;
    const proofFiles = logProofFiles;
    setTargets((prev) => prev.map((x) => (x.id === targetId ? { ...x, completed_tasks: (x.completed_tasks || 0) + amt } : x)));
    setLogTarget(null);
    setLogAmount(1);
    setLogProofFiles([]);
    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "updateProgress",
        targetId,
        amount: amt,
        userId: currentUser.id,
        managerId: data.directorId,
        employeeName: currentUser.name,
        proofFiles,
      });
      const updatedTarget = res?.data?.target;
      const mgrId = tg?.manager_id || data.directorId;
      const newCompleted = updatedTarget?.completed_tasks ?? (tg?.completed_tasks || 0) + amt;
      addNotification(
        company.id,
        mgrId,
        updatedTarget?.status === "pending_review"
          ? `${currentUser.name} → ${tg?.title || t("setTarget")}: ${t("reviewSubmission")} (${newCompleted}/${tg?.task_target || "?"}).`
          : `${currentUser.name} → ${tg?.title || t("setTarget")}: +${amt} ${t("tasksUnit")} (${newCompleted}/${tg?.task_target || "?"}).`
      );
      if (updatedTarget) {
        setTargets((prev) => prev.map((x) => (x.id === updatedTarget.id ? updatedTarget : x)));
      }
    } catch (err) {
      // Roll back the optimistic progress and restore the log form.
      if (prevSnapshot) setTargets((prev) => prev.map((x) => (x.id === targetId ? prevSnapshot : x)));
      setLogTarget(targetId);
      setLogAmount(amt);
      setLogProofFiles(proofFiles);
      const code = err?.response?.data?.error;
      alert(code === "PROOF_REQUIRED" ? t("proofRequired") : (code || "Failed to update progress"));
    }
  };

  // Manager reviews an employee's submitted proof — approve grants points, reject requires
  // a written reason (no arbitrary rejections) and is recorded to the audit trail.
  const reviewTarget = async (tg, approve, reason) => {
    // Optimistic status change: show the review outcome immediately, roll back on failure.
    const prevSnapshot = { ...tg };
    setTargets((prev) => prev.map((x) => (x.id === tg.id ? { ...x, status: approve ? "completed" : "active" } : x)));
    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "reviewCompletion",
        userRole: currentUser.role,
        targetId: tg.id,
        approve,
        reason,
        reviewerId: currentUser.id,
        reviewerName: currentUser.name,
      });
      const updated = res?.data?.target;
      if (updated) {
        setTargets((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      }
      if (!approve) {
        logAudit(company.id, "task_completion_rejected", currentUser.name, `${t("reject")} "${tg.title || ""}": ${reason}`);
      }
      if (approve) {
        const pts = PRIORITY_POINTS[tg.priority] || 75;
        let recipients = [];
        if (tg.assignment_type === "member" && tg.employee_id) {
          recipients = [tg.employee_id];
        } else if (tg.assignment_type === "station_team") {
          recipients = data.employees.filter((e) => e.stationId === tg.assignment_id).map((e) => e.id);
        } else if (tg.assignment_type === "hq_team") {
          recipients = data.employees.filter((e) => !e.stationId).map((e) => e.id);
        }
        for (const rid of recipients) {
          addPoints(company.id, rid, pts, `${t("taskCompleted")}: ${tg.title || ""}`);
        }
      }
    } catch (err) {
      // Roll back the optimistic status change.
      setTargets((prev) => prev.map((x) => (x.id === tg.id ? prevSnapshot : x)));
      alert(err?.response?.data?.error || "Failed to review");
    }
  };

  const submitComment = async (targetId) => {
    const text = commentText.trim();
    if (!text && commentFiles.length === 0) return;
    // Optimistic update: render the comment immediately, roll back on failure.
    const files = commentFiles;
    const isIssue = markIssue;
    const optimistic = {
      id: `tmp_${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      content: text,
      files,
      is_issue: isIssue,
      created_at: new Date().toISOString(),
    };
    setTargets((prev) => prev.map((x) => (x.id === targetId ? { ...x, comments: [...(Array.isArray(x.comments) ? x.comments : []), optimistic] } : x)));
    setCommentText("");
    setCommentFiles([]);
    setMarkIssue(false);
    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "addComment",
        targetId,
        userId: currentUser.id,
        userName: currentUser.name,
        content: text,
        files,
        isIssue,
      });
      const updated = res?.data?.comments || [];
      setTargets((prev) => prev.map((x) => (x.id === targetId ? { ...x, comments: updated } : x)));
    } catch (err) {
      // Remove the optimistic comment and restore the input.
      setTargets((prev) => prev.map((x) => (x.id === targetId ? { ...x, comments: (Array.isArray(x.comments) ? x.comments : []).filter((c) => c.id !== optimistic.id) } : x)));
      setCommentText(text);
      setCommentFiles(files);
      setMarkIssue(isIssue);
      alert(err?.response?.data?.error || "Failed to add comment");
    }
  };

  // Escalation chain: level 0 = station manager, then up the company's HR tiers —
  // same chain already used for anonymous/public complaints (see src/lib/escalation.js).
  const STAGE_COUNT = groupLevelsByOrder(data.hrLevels || []).length + 1;
  const escalationLevelOf = (tg) => Math.min(tg.escalation_level || 0, STAGE_COUNT - 1);
  const escalationStepsFor = (tg) => buildEscalationSteps(escalationLevelOf(tg), { stationId: targetStationKey(tg) }, data, t, lang, STAGE_COUNT);

  // Employee's manual objection when they disagree with a rejection — escalates to the
  // next handler up the HR chain instead of always notifying the same manager again.
  const disputeRejection = async (tg, message) => {
    const nextLevel = Math.min((tg.escalation_level || 0) + 1, STAGE_COUNT - 1);
    const handlers = handlersForLevel(nextLevel, { stationId: targetStationKey(tg) }, data);
    if (handlers.length === 0 && !confirm(`${t("noHandlerAssigned")}. ${lang === "ar" ? "المتابعة؟" : "Continue anyway?"}`)) return;
    const notifyUserIds = handlers.length ? handlers.map((h) => h.id) : [tg.manager_id];
    try {
      const res = await base44.functions.invoke("supabaseTargets", {
        action: "disputeRejection",
        targetId: tg.id,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        message,
        escalationLevel: nextLevel,
        notifyUserIds,
      });
      const updated = res?.data?.target;
      if (updated) setTargets((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      logAudit(company.id, "rejection_disputed", currentUser.name, `"${tg.title || ""}": ${message}`);
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to submit objection");
    }
  };

  const deleteTarget = async (targetId) => {
    const tg = targets.find((x) => x.id === targetId);
    try {
      await base44.functions.invoke("supabaseTargets", { action: "deleteTarget", targetId });
      setTargets((prev) => prev.filter((x) => x.id !== targetId));
      logAudit(company.id, "task_deleted", currentUser.name, `"${tg?.title || targetId}" (${tg?.status || "?"})`);
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
        section: fd.get("section"),
        priority: fd.get("priority"),
        endDate: fd.get("endDate"),
        taskTarget: fd.get("totalTasks"),
      });
      const updated = res?.data?.target;
      if (updated) {
        setTargets((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      }
      const newSection = fd.get("section");
      if (newSection) {
        ensureFolder(newSection, targetStationKey(editTarget));
      }
      setEditTarget(null);
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to update");
    }
  };

  const canManage = (tg) =>
    canCreateTasks(currentUser) &&
    (tg.manager_id === currentUser.id ||
      canSeeAllStations(currentUser) ||
      (currentUser.role === "station_manager" && targetStationKey(tg) === currentUser.stationId) ||
      // Escalated dispute: the next-level HR handler also gains review rights on this task.
      ((tg.escalation_level || 0) > 0 && handlersForLevel(Math.min(tg.escalation_level, STAGE_COUNT - 1), { stationId: targetStationKey(tg) }, data).some((h) => h.id === currentUser.id)));

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
    "3months": t("preset3Months"),
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
  const stationTargetsAll = selectedStation ? targets.filter((tg) => targetStationKey(tg) === selectedStation) : [];
  const allStationFolders = withAncestors([
    ...folders.filter((f) => f.station_id === selectedStation).map((f) => f.path),
    ...stationTargetsAll.filter((tg) => tg.section).map((tg) => tg.section),
  ]);
  // Only show sections that belong to the station/team currently selected in the form —
  // otherwise every section from every station across the company piles up in one list.
  const sectionScopeKey = assignType === "hq_team" ? "hq" : (formStation || null);
  const existingSections = sectionScopeKey
    ? Array.from(new Set([
        ...targets.filter((tg) => tg.section && targetStationKey(tg) === sectionScopeKey).map((tg) => tg.section),
        ...folders.filter((f) => f.station_id === sectionScopeKey).map((f) => f.path),
      ]))
    : [];
  const allSectionFolders = [
    { key: NO_SECTION, name: t("noSection") },
    ...allStationFolders.map((p) => ({ key: p, name: p })),
  ];
  const selectedStationName = selectedStation === "hq" ? t("hq") : stationName(selectedStation);
  const hasAnyContent = folders.filter((f) => f.station_id === selectedStation).length > 0 || stationTargetsAll.length > 0;

  const isDueToday = (tg) => {
    if (!tg.end_date || tg.status === "completed") return false;
    const end = new Date(tg.end_date);
    const now = new Date();
    return end.toDateString() === now.toDateString();
  };

  const filterTasks = (arr) => arr
    .filter((tg) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "due_today") return isDueToday(tg);
      return tg.status === statusFilter;
    })
    .filter((tg) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (tg.title || "").toLowerCase().includes(q) || (tg.description || "").toLowerCase().includes(q);
    })
    .sort((a, b) => (sortBy === "priority"
      ? (PRIORITY_WEIGHT[a.priority] ?? 2) - (PRIORITY_WEIGHT[b.priority] ?? 2)
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

  const renderTask = (tg) => (
    <TaskCard
      key={tg.id}
      tg={tg}
      t={t} dir={dir} lang={lang}
      assignmentLabel={assignmentLabel(tg)}
      canManage={canManage(tg)}
      canLog={canLog(tg)}
      logTarget={logTarget} logAmount={logAmount} setLogTarget={setLogTarget} setLogAmount={setLogAmount} logCompleted={logCompleted}
      logProofFiles={logProofFiles} setLogProofFiles={setLogProofFiles} reviewTarget={reviewTarget} disputeRejection={disputeRejection}
      escalationSteps={escalationStepsFor(tg)}
      commentsOpen={commentsOpen} setCommentsOpen={setCommentsOpen} commentText={commentText} setCommentText={setCommentText} commentFiles={commentFiles} setCommentFiles={setCommentFiles} submitComment={submitComment}
      markIssue={markIssue} setMarkIssue={setMarkIssue}
      allSectionFolders={allSectionFolders} moveTaskToSection={moveTaskToSection} setEditTarget={setEditTarget} deleteTarget={deleteTarget}
    />
  );

  return (
    <PullToRefresh onRefresh={async () => {
      // Full state reload: local fetches + tanstack-query caches + AuthContext store sync.
      await Promise.allSettled([fetchTargets(), fetchFolders(), queryClientInstance.invalidateQueries()]);
      refresh();
    }}>
    <div className="space-y-6">
      <PageHeader
        title={t("myTasks")}
        icon={Target}
        actions={canCreateTasks(currentUser) && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-body hover:bg-accent transition-colors"
          >
            <Plus className="w-4 h-4" /> {t("newTaskTarget")}
          </button>
        )}
      />

      {!checkedInToday && (
        <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-800 font-body flex items-center gap-2"><ClipboardCheck className="w-4 h-4" /> {t("mustCheckInFirst")}</p>
          <Link to="/app/attendance" className="text-xs font-body text-accent hover:underline whitespace-nowrap">{t("goToAttendance")}</Link>
        </div>
      )}

      {/* Statistics overview */}
      {!targetsLoading && targets.length > 0 && <TaskStats targets={targets} t={t} />}

      {targets.some((tg) => tg.status === "active" && Array.isArray(tg.comments) && tg.comments.some((c) => c.is_rejection || c.is_dispute)) && (
        <EscalationInfoBox t={t} />
      )}

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

          {/* File attachments */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> {t("attachFile")}</p>
            <div className="flex flex-wrap items-end gap-2">
              <CommentFiles files={taskFiles} setFiles={setTaskFiles} />
              <VoiceRecorder files={taskFiles} setFiles={setTaskFiles} />
            </div>
          </div>

          {/* Assignment type selector */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("assignTo")}</p>
            <div className="flex flex-wrap gap-2">
              {[
                { val: "member", label: t("member"), icon: User },
                { val: "station_team", label: t("stationTeam"), icon: Users },
                { val: "hq_team", label: t("hqTeam"), icon: Building2 },
              ].map(({ val, label, icon: OptIcon }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setAssignType(val); setFormStation(""); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${assignType === val ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
                >
                  <OptIcon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
            <input type="hidden" name="assignType" value={assignType} />
          </div>

          {/* Conditional assignment fields */}
          {assignType === "member" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StationCombobox
                t={t}
                value={formStation}
                onChange={setFormStation}
                placeholder={t("all")}
                options={[
                  { value: "", label: t("all") },
                  { value: "hq", label: t("hq") },
                  ...data.stations.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
              <MobileSelect
                name="assignedTo"
                defaultValue=""
                placeholder={t("selectEmployee")}
                options={memberCandidates
                  .filter((e) => e.role === "employee" || e.role === "station_manager")
                  .map((e) => ({ value: e.id, label: `${e.name} — ${e.stationId ? stationName(e.stationId) : t("hq")}` }))}
              />
            </div>
          )}

          {assignType === "station_team" && (
            <>
              <input type="hidden" name="stationId" value={formStation} />
              <StationCombobox
                t={t}
                value={formStation}
                onChange={setFormStation}
                placeholder={t("selectStation")}
                options={data.stations.map((s) => ({ value: s.id, label: s.name }))}
              />
            </>
          )}

          {assignType === "hq_team" && (
            <p className="text-xs text-muted-foreground font-body">{t("hqTeamNote")}</p>
          )}

          {/* Section — searchable existing folders or a new section name */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {t("section")}</p>
            <SectionPicker
              value={sectionValue}
              onChange={setSectionValue}
              options={existingSections}
              placeholder={t("sectionName")}
              ar={lang === "ar"}
            />
            <p className="text-[11px] text-muted-foreground font-body mt-1">{t("sectionTaskTypeHint")}</p>
          </div>

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
            <button type="button" onClick={() => { setShowCreate(false); setSectionValue(""); }} className="px-4 py-2 rounded-md border border-border text-sm font-body">{t("cancel")}</button>
          </div>
        </form>
      )}

      {/* Task Targets — organized by station as a hierarchical folder tree */}
      <div className="p-5 rounded-xl border border-border bg-card space-y-4">
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
          <Target className="w-4 h-4" /> {t("targets")}
        </h2>

        <AnimatePresence mode="wait">
        {targetsLoading ? (
          <div className="space-y-3 py-2" aria-label={t("loading") || "Loading"}>
            {[1, 2, 3].map((item) => <div key={item} className="h-20 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : !selectedStation ? (
          stationGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">{t("noTargets")}</p>
          ) : (
            <motion.div
              key="stations"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {stationGroups.map((g) => (
                <button
                  key={g.key}
                  onClick={() => { setSelectedStation(g.key); setFolderPath(null); }}
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
            </motion.div>
          )
        ) : (
          <motion.div
            key="browser"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-3"
          >
            <button
              onClick={() => { setSelectedStation(null); setFolderPath(null); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground font-body hover:text-foreground"
            >
              <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} /> {t("back")}
            </button>

            <h3 className="font-heading font-semibold">{selectedStationName}</h3>

            {hasAnyContent && (
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
                <MobileSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder={t("allStatuses")}
                  options={[
                    { value: "all", label: t("allStatuses") },
                    { value: "active", label: t("inProgress") },
                    { value: "completed", label: t("completed") },
                    { value: "overdue", label: t("overdue") },
                    { value: "due_today", label: t("dueToday") },
                  ]}
                />
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === "overdue" ? "all" : "overdue")}
                    className={`px-2.5 py-1 rounded-full text-xs font-body border transition ${statusFilter === "overdue" ? "bg-red-600 text-white border-red-600" : "border-red-300 text-red-700 hover:bg-red-50"}`}
                  >
                    {t("overdue")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === "due_today" ? "all" : "due_today")}
                    className={`px-2.5 py-1 rounded-full text-xs font-body border transition ${statusFilter === "due_today" ? "bg-amber-600 text-white border-amber-600" : "border-amber-300 text-amber-700 hover:bg-amber-50"}`}
                  >
                    {t("dueToday")}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-muted-foreground font-body">{t("sortBy")}:</span>
                  <button onClick={() => setSortBy("priority")} className={`px-2.5 py-1 rounded-full text-xs font-body border transition ${sortBy === "priority" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>{t("byPriority")}</button>
                  <button onClick={() => setSortBy("date")} className={`px-2.5 py-1 rounded-full text-xs font-body border transition ${sortBy === "date" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>{t("byNewest")}</button>
                </div>
              </div>
            )}

            {!hasAnyContent && !canCreateTasks(currentUser) ? (
              <p className="text-sm text-muted-foreground font-body">{t("noTargets")}</p>
            ) : (
              <DragDropContext onDragEnd={handleTreeDragEnd}>
                <FolderTree
                  stationId={selectedStation}
                  currentPath={folderPath}
                  onNavigate={setFolderPath}
                  folders={folders}
                  tasksAll={stationTargetsAll}
                  canManage={canCreateTasks(currentUser)}
                  renderTask={renderTask}
                  filterTasks={filterTasks}
                  onAddFolder={addFolderAt}
                  onRenameFolder={renameFolder}
                  onDeleteFolder={deleteFolder}
                  t={t}
                  dir={dir}
                />
              </DragDropContext>
            )}
          </motion.div>
        )}
        </AnimatePresence>
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
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">{t("section")}</label>
              <input name="section" defaultValue={editTarget.section || ""} placeholder={t("sectionName")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
            </div>
            <textarea name="steps" rows={3} defaultValue={editTarget.steps || ""} placeholder={t("stepsPlaceholder")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body resize-y" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-body block mb-1">{t("priority")}</label>
                <MobileSelect
                  key={editTarget.id}
                  name="priority"
                  defaultValue={editTarget.priority || "medium"}
                  placeholder={t("priority")}
                  className="w-full"
                  options={[
                    { value: "urgent", label: t("urgent") },
                    { value: "high", label: t("high") },
                    { value: "medium", label: t("medium") },
                    { value: "low", label: t("low") },
                  ]}
                />
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
    </PullToRefresh>
  );
}