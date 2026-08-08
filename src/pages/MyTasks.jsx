import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext } from "@hello-pangea/dnd";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { addNotification, getCompanyToken, syncPointsFromCloud } from "@/lib/store";
import { canCreateTasks, canSeeAllStations, visibleStations } from "@/lib/permissions";
import { handlersForLevel, hasHandlerAtLevel, buildEscalationSteps, escalationStageCount } from "@/lib/escalation";
import { base44 } from "@/api/base44Client";
import { getLeafName, getParentPath, NO_SECTION } from "@/lib/taskFolders";
import { logAudit } from "@/lib/auditLog";
import { loadSmartDefaults, saveSmartDefaults } from "@/lib/smartDefaults";
import { suggestEffortWeight, EFFORT_WEIGHT_LABELS } from "@/lib/effortWeights";
import { getTodayAttendance } from "@/lib/attendance";
import { Link } from "react-router-dom";
import { Plus, Check, Target, User, Users, Building2, Calendar, AlertTriangle, Paperclip, ListOrdered, FileText, ChevronRight, ArrowLeft, Radio, Clock, Search, Pencil, X, ClipboardCheck, Archive, Sparkles } from "lucide-react";
import TaskStats from "@/components/tasks/TaskStats";
import TaskCard from "@/components/tasks/TaskCard";
import StationSections from "@/components/tasks/StationSections";
import SmartArchive from "@/components/tasks/SmartArchive";
import TaskReportExport from "@/components/tasks/TaskReportExport";
import CommentFiles from "@/components/tasks/CommentFiles";
import EscalationInfoBox from "@/components/escalation/EscalationInfoBox";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import MobileSelect from "@/components/mobile/MobileSelect";
import PageHeader from "@/components/PageHeader";
import { queryClientInstance } from "@/lib/query-client";
import { toast } from "@/components/ui/use-toast";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";
import CompletionModeToggle from "@/components/tasks/CompletionModeToggle";
import TaskWizardStepper from "@/components/tasks/TaskWizardStepper";
import TaskFormStep from "@/components/tasks/TaskFormStep";
import TaskStepNav from "@/components/tasks/TaskStepNav";
import MemberMultiSelect from "@/components/tasks/MemberMultiSelect";

const DATE_PRESETS = [
  { val: "monthly", months: 1 },
  { val: "3months", months: 3 },
  { val: "6months", months: 6 },
  { val: "yearly", months: 12 },
  { val: "days", months: 0 },
  { val: "custom", months: 0 },
];

const PRIORITY_WEIGHT = { urgent: 0, high: 1, medium: 2, low: 3 };
const PERSONAL_WORKSPACE_ID = "hq"; // Legacy backend room used only by Individual plans.
const hasTodayCheckIn = (attendance) => ["present", "late"].includes(attendance?.status);

export default function MyTasks() {
  const { t, dir, lang } = useI18n();
  const { data, currentUser, company, refresh } = useAuth();
  const targetsCall = (payload) => base44.functions.invoke("supabaseTargets", {
    ...payload,
    companyId: company?.id,
    userId: currentUser?.id,
    sessionToken: company?.id ? getCompanyToken(company.id) : null,
  });
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
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [completionMode, setCompletionMode] = useState("onsite");
  const [effortWeight, setEffortWeight] = useState(1);
  const [assignedIds, setAssignedIds] = useState([]);
  const [weightSuggested, setWeightSuggested] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [editStep, setEditStep] = useState(0);
  const [logAttestation, setLogAttestation] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const creatingRef = useRef(false);
  const createFormRef = useRef(null);
  const editFormRef = useRef(null);

  // Smart form memory — opening the create form pre-fills the user's usual choices.
  const openCreateForm = (stationId = null, sectionPath = null) => {
    const opening = !showCreate;
    if (opening) {
      const d = loadSmartDefaults(`task_${currentUser?.id}`);
      if (d) {
        if (d.assignType && !isIndividual) setAssignType(d.assignType);
        if (d.formStation && !stationId) setFormStation(d.formStation);
        if (d.priority) setPriority(d.priority);
        if (d.datePreset && d.datePreset !== "custom") setDatePreset(d.datePreset);
        setPrefilled(true);
      } else {
        setPrefilled(false);
      }
      if (stationId) setFormStation(stationId);
      if (sectionPath) setSectionValue(sectionPath);
    }
    setShowCreate(opening);
    setCreateStep(0);
    if (opening) requestAnimationFrame(() => document.getElementById("task-create-form")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  // Individual (personal) workspaces: no stations, no attendance gate, no escalation.
  const isIndividual = String(data?.plan || company?.plan || "").toLowerCase() === "individual";
  const canSetCompletionMode = currentUser?.id === data?.ownerId || ["station_manager", "ops_manager", "director"].includes(currentUser?.role);

  const fetchTargets = async () => {
    if (!currentUser) return;
    // Instant open: render the cached list immediately, refresh in the background.
    const cacheKey = `pc_targets_${currentUser.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try { setTargets(JSON.parse(cached)); } catch { /* ignore bad cache */ }
    } else {
      setTargetsLoading(true);
    }
    try {
      const res = await targetsCall({
        action: "listTargets",
        userRole: currentUser.role,
        userId: currentUser.id,
        stationId: currentUser.stationId || null,
        managedStations: currentUser.managedStations || [],
      });
      const list = res.data.targets || [];
      setTargets(list);
      sessionStorage.setItem(cacheKey, JSON.stringify(list));
    } catch {
      if (!cached) setTargets([]);
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
    if (isIndividual) { setCheckedInToday(true); return; }
    getTodayAttendance(currentUser.id).then((att) => setCheckedInToday(hasTodayCheckIn(att)));
  }, [currentUser?.id, isIndividual]);

  // Individuals go straight into their personal folder browser and self-assign tasks.
  useEffect(() => {
    if (isIndividual) { setSelectedStation(PERSONAL_WORKSPACE_ID); setAssignType("hq_team"); }
  }, [isIndividual]);

  const fetchFolders = async () => {
    const cached = sessionStorage.getItem("pc_folders");
    if (cached) {
      try { setFolders(JSON.parse(cached)); } catch { /* ignore bad cache */ }
    }
    try {
      const res = await targetsCall({ action: "listFolders" });
      const list = res.data.folders || [];
      setFolders(list);
      sessionStorage.setItem("pc_folders", JSON.stringify(list));
    } catch {
      if (!cached) setFolders([]);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  // Re-tapping the Tasks bottom tab resets the station/folder browser to root.
  useEffect(() => {
    const onReset = (e) => {
      if (e.detail === "/app/tasks") { setSelectedStation(isIndividual ? PERSONAL_WORKSPACE_ID : null); setFolderPath(null); }
    };
    window.addEventListener("powercare:tab-reset", onReset);
    return () => window.removeEventListener("powercare:tab-reset", onReset);
  }, [isIndividual]);

  const addFolderAt = async (_parentPath, name) => {
    if (!selectedStation) return false;
    const path = name.trim().replaceAll("/", "-");
    if (!path) return false;
    if (folders.some((f) => f.station_id === selectedStation && f.path === path)) {
      alert(t("sectionAlreadyExists") || "This section already exists.");
      return false;
    }
    const sortOrder = folders.filter((f) => f.station_id === selectedStation).length;
    try {
      const res = await targetsCall({ action: "createFolder", stationId: selectedStation, path, sortOrder });
      const created = res?.data?.folder;
      if (!created) return false;
      setFolders((prev) => [...prev, created]);
      return true;
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || "Failed to create section");
      return false;
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
      const res = await targetsCall({ action: "createFolder", stationId: forStationId, path, sortOrder });
      const created = res?.data?.folder;
      if (created) setFolders((prev) => [...prev, created]);
    } catch {
      // best-effort — folder will still be usable via the existing sections list
    }
  };

  const moveTaskToSection = async (tg, newSectionKey) => {
    const section = newSectionKey === NO_SECTION ? "" : newSectionKey;
    try {
      const res = await targetsCall({
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
    const newPath = newName.trim().replaceAll("/", "-");
    const affectedTasks = targets.filter((tg) => targetStationKey(tg) === selectedStation && tg.section === oldPath);
    try {
      await Promise.all(
        affectedTasks.map((tg) =>
          targetsCall({
            action: "updateTarget",
            userRole: currentUser.role,
            targetId: tg.id,
            section: newPath,
          })
        )
      );
      await targetsCall({
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
    const affectedTasks = targets.filter((tg) => targetStationKey(tg) === selectedStation && tg.section === folderPath);
    if (affectedTasks.length > 0) {
      alert(lang === "ar" ? "انقل مهام القسم إلى قسم آخر قبل حذفه." : "Move this section's tasks to another section before deleting it.");
      return;
    }
    try {
      await Promise.all(
        affectedTasks.map((tg) =>
          targetsCall({
            action: "updateTarget",
            userRole: currentUser.role,
            targetId: tg.id,
            section: "",
          })
        )
      );
      await targetsCall({
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
      await targetsCall({ action: "reorderFolders", items });
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
      const siblings = folders
        .filter((f) => f.station_id === selectedStation)
        .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
      const reordered = Array.from(siblings);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      reorderChildren(null, reordered.map((f) => f.id));
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

  useEffect(() => {
    if (!data || !currentUser || isIndividual || !selectedStation) return;
    if (!visibleStations(currentUser, data).some((station) => station.id === selectedStation)) setSelectedStation(null);
  }, [data?.stations, currentUser, isIndividual, selectedStation]);

  if (!data || !currentUser) return null;

  const firstStationId = data.stations?.[0]?.id || null;
  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";
  const employeeName = (id) => data.employees.find((e) => e.id === id)?.name || "—";

  const memberCandidates = formStation
    ? data.employees.filter((e) => (e.stationId || firstStationId) === formStation)
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

  // Per-step validation. The browser's own `required` can't be used here: hidden
  // steps stay mounted (so their values survive), and a hidden required field makes
  // the browser refuse to submit with no visible message at all.
  const validateCreateStep = (index) => {
    const fd = new FormData(createFormRef.current);
    const fail = (message) => { toast({ description: message, variant: "destructive" }); return false; };
    if (index === 0 && !String(fd.get("title") || "").trim()) return fail(t("taskTitle"));
    if (index === 1) {
      if (!isIndividual && assignType === "member" && assignedIds.length === 0) return fail(t("selectEmployee"));
      if (!fd.get("section")) return fail(t("sectionName"));
    }
    if (index === 2) {
      const total = Number(fd.get("totalTasks"));
      if (!Number.isFinite(total) || total < 1) return fail(t("totalTasks"));
      if (datePreset === "days" && !(Number(customDays) >= 1)) return fail(t("numberOfDays"));
      if (datePreset === "custom" && (!customStart || !customEnd || customEnd < customStart)) return fail(t("selectDate"));
    }
    return true;
  };

  // Jumping back is always allowed; jumping forward must pass every step in between.
  const canJumpCreate = (target) => {
    if (target <= createStep) return true;
    for (let i = createStep; i < target; i++) if (!validateCreateStep(i)) { setCreateStep(i); return false; }
    return true;
  };

  const validateEditStep = (index) => {
    const fd = new FormData(editFormRef.current);
    const fail = (message) => { toast({ description: message, variant: "destructive" }); return false; };
    if (index === 0 && !String(fd.get("title") || "").trim()) return fail(t("taskTitle"));
    if (index === 1) {
      const total = Number(fd.get("totalTasks"));
      if (!Number.isFinite(total) || total < 1) return fail(t("totalTasks"));
      if (!fd.get("endDate")) return fail(t("endDate"));
    }
    return true;
  };

  const canJumpEdit = (target) => {
    if (target <= editStep) return true;
    for (let i = editStep; i < target; i++) if (!validateEditStep(i)) { setEditStep(i); return false; }
    return true;
  };

  const createTarget = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = fd.get("title");
    const description = fd.get("description") || "";
    const steps = fd.get("steps") || "";
    const section = fd.get("section") || "";
    if (!section) { alert(t("sectionName")); return; }
    const total = Number(fd.get("totalTasks") || 1);
    const aType = fd.get("assignType") || "member";

    let employeeId = null;
    let assignmentId = null;
    let stationId = null;
    // A member task can be assigned to several people at once — one task per member.
    let recipients = [];

    if (aType === "member") {
      if (assignedIds.length === 0) { alert(t("selectEmployee")); return; }
      recipients = assignedIds;
      employeeId = assignedIds[0];
      const emp = data.employees.find((x) => x.id === employeeId);
      stationId = emp?.stationId || firstStationId;
      assignmentId = employeeId;
    } else if (aType === "station_team") {
      stationId = fd.get("stationId");
      if (!stationId) { alert(t("selectStation")); return; }
      assignmentId = stationId;
    }

    const { startDate, endDate } = computeDates();
    if (!endDate) { alert(t("selectDate")); return; }

    const fileUrls = taskFiles.length > 0 ? taskFiles.map((f) => ({ url: f.url, name: f.name, type: f.type })) : null;

    if (creatingRef.current) return;
    creatingRef.current = true;
    setIsCreating(true);
    try {
      const basePayload = {
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
        effortWeight,
        completionMode: canSetCompletionMode ? completionMode : "onsite",
        startDate,
        endDate,
      };
      const results = aType === "member"
        ? await Promise.all(recipients.map((id) => {
            const emp = data.employees.find((x) => x.id === id);
            return targetsCall({ ...basePayload, employeeId: id, assignmentId: id, stationId: emp?.stationId || firstStationId });
          }))
        : [await targetsCall(basePayload)];
      const createdList = results.map((r) => r?.data?.target).filter((x) => x?.id);
      if (createdList.length > 0) {
        setTargets((prev) => [...createdList, ...prev.filter((x) => !createdList.some((c) => c.id === x.id))]);
      }
      // Remember these choices for the next task (smart pre-fill).
      saveSmartDefaults(`task_${currentUser.id}`, { assignType: aType, formStation, priority, datePreset });
      if (section) {
        ensureFolder(section, aType === "hq_team" ? PERSONAL_WORKSPACE_ID : stationId);
      }
      if (aType === "member") {
        for (const id of recipients) {
          addNotification(company.id, id, `${t("setTarget")}: ${title} — ${total} ${t("tasksUnit")}.`);
        }
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
      setEffortWeight(1);
      setAssignedIds([]);
      setWeightSuggested(false);
      setCompletionMode("onsite");
      setSectionValue("");
      setCreateStep(0);
      fetchTargets();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to create");
    } finally {
      creatingRef.current = false;
      setIsCreating(false);
    }
  };

  const logCompleted = async (targetId) => {
    const tg = targets.find((x) => x.id === targetId);
    if (!isIndividual && (tg?.completionMode || "onsite") === "onsite" && !checkedInToday) {
      const attendance = await getTodayAttendance(currentUser.id);
      if (!hasTodayCheckIn(attendance)) {
        toast({ description: t("mustCheckInFirst"), variant: "destructive" });
        return;
      }
      setCheckedInToday(true);
    }
    const amt = Number(logAmount) || 0;
    if (amt <= 0) return;
    // Optimistic update: reflect the new progress immediately, roll back on failure.
    const prevSnapshot = tg ? { ...tg } : null;
    const proofFiles = logProofFiles;
    const attestation = logAttestation.trim();
    setTargets((prev) => prev.map((x) => (x.id === targetId ? { ...x, completed_tasks: (x.completed_tasks || 0) + amt } : x)));
    setLogTarget(null);
    setLogAmount(1);
    setLogProofFiles([]);
    setLogAttestation("");
    try {
      const res = await targetsCall({
        action: "updateProgress",
        targetId,
        amount: amt,
        userId: currentUser.id,
        managerId: data.directorId,
        employeeName: currentUser.name,
        proofFiles,
        attestation,
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
      setLogAttestation(attestation);
      const code = err?.response?.data?.error;
      alert(code === "PROOF_REQUIRED" ? t("proofRequired") : code === "CHECK_IN_REQUIRED" ? t("mustCheckInFirst") : (code || "Failed to update progress"));
    }
  };

  // Manager reviews an employee's submitted proof — approve grants points, reject requires
  // a written reason (no arbitrary rejections) and is recorded to the audit trail.
  const reviewTarget = async (tg, approve, reason) => {
    // Optimistic status change: show the review outcome immediately, roll back on failure.
    const prevSnapshot = { ...tg };
    setTargets((prev) => prev.map((x) => (x.id === tg.id ? { ...x, status: approve ? "completed" : "active" } : x)));
    try {
      const res = await targetsCall({
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
      // Points are computed and granted by the server (one equation, one ledger
      // entry per recipient). The client only re-reads the updated scores.
      if (approve) {
        await syncPointsFromCloud(company.id);
        refresh();
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
      const res = await targetsCall({
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
  const STAGE_COUNT = escalationStageCount(data);
  const escalationLevelOf = (tg) => Math.min(tg.escalation_level || 0, STAGE_COUNT - 1);
  const escalationStepsFor = (tg) => buildEscalationSteps(escalationLevelOf(tg), { stationId: targetStationKey(tg) }, data, t, lang, STAGE_COUNT);

  // Employee's manual objection when they disagree with a rejection — escalates to the
  // next handler up the HR chain instead of always notifying the same manager again.
  const disputeRejection = async (tg, message) => {
    if ((tg.escalation_level || 0) >= STAGE_COUNT - 1) {
      alert(t("noHandlerAssigned"));
      return;
    }
    const nextLevel = (tg.escalation_level || 0) + 1;
    const targetScope = { stationId: targetStationKey(tg) };
    if (!hasHandlerAtLevel(nextLevel, targetScope, data)) {
      alert(t("noHandlerAssigned"));
      return;
    }
    const handlers = handlersForLevel(nextLevel, targetScope, data);
    const notifyUserIds = handlers.map((handler) => handler.id);
    try {
      const res = await targetsCall({
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

  const convertToRemote = async (tg) => {
    try {
      const res = await targetsCall({ action: "convertToRemote", targetId: tg.id });
      const updated = res?.data?.target;
      if (updated) setTargets((prev) => prev.map((item) => item.id === updated.id ? updated : item));
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to convert task");
    }
  };

  const completeTarget = async (tg) => {
    const previous = { ...tg };
    setTargets((items) => items.map((item) => item.id === tg.id ? { ...item, status: "completed", completed_tasks: item.task_target } : item));
    try {
      const res = await targetsCall({ action: "managerComplete", targetId: tg.id });
      const updated = res?.data?.target;
      if (updated) setTargets((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch (err) {
      setTargets((items) => items.map((item) => item.id === tg.id ? previous : item));
      alert(err?.response?.data?.error || (lang === "ar" ? "تعذر إنهاء المهمة" : "Failed to complete task"));
      throw err;
    }
  };

  const deleteTarget = async (targetId) => {
    const tg = targets.find((x) => x.id === targetId);
    try {
      await targetsCall({ action: "deleteTarget", targetId });
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
      const res = await targetsCall({
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
        effortWeight: fd.get("effortWeight"),
        completionMode: canSetCompletionMode ? (fd.get("completionMode") || "onsite") : undefined,
        });
      const updated = res?.data?.target;
      if (updated) {
        setTargets((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      }
      // Changing the weight of a running task is recorded in the audit trail
      // with the name of whoever changed it.
      const nextWeight = Number(fd.get("effortWeight")) || 1;
      const prevWeight = Number(editTarget.effortWeight) || 1;
      if (nextWeight !== prevWeight) {
        logAudit(company.id, "task_effort_weight_changed", currentUser.name, `"${editTarget.title || ""}": ×${prevWeight} → ×${nextWeight}`);
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
      (currentUser.role === "station_manager" && targetStationKey(tg) === (currentUser.stationId || firstStationId)) ||
      // Escalated dispute: the next-level HR handler also gains review rights on this task.
      ((tg.escalation_level || 0) > 0 && handlersForLevel(Math.min(tg.escalation_level, STAGE_COUNT - 1), { stationId: targetStationKey(tg) }, data).some((h) => h.id === currentUser.id)));

  const assignmentLabel = (tg) => {
    if (tg.assignment_type === "member") return <>{t("member")}: <EmployeeNameLink employeeId={tg.employee_id} employeeName={employeeName(tg.employee_id)} /></>;
    if (tg.assignment_type === "station_team") return `${t("stationTeam")}: ${stationName(tg.assignment_id)}`;
    if (tg.assignment_type === "hq_team") return `${t("stationTeam")}: ${stationName(firstStationId)}`;
    return <EmployeeNameLink employeeId={tg.employee_id} employeeName={employeeName(tg.employee_id)} />;
  };

  const canLog = (tg) => {
    if (tg.assignment_type === "member") return tg.employee_id === currentUser.id;
    if (tg.assignment_type === "station_team") return tg.assignment_id === (currentUser.stationId || firstStationId);
    if (tg.assignment_type === "hq_team") return (currentUser.stationId || firstStationId) === firstStationId;
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
  const empStation = (id) => data.employees.find((e) => e.id === id)?.stationId || firstStationId;
  const targetStationKey = (tg) => {
    if (tg.assignment_type === "station_team") return tg.assignment_id || tg.station_id || firstStationId;
    if (tg.assignment_type === "member") return tg.station_id || empStation(tg.employee_id) || firstStationId;
    if (tg.assignment_type === "hq_team") return firstStationId;
    return tg.station_id || firstStationId;
  };
  const groupMap = {};
  for (const tg of targets) {
    const key = targetStationKey(tg);
    if (!groupMap[key]) groupMap[key] = { key, count: 0 };
    groupMap[key].count++;
  }
  const visible = visibleStations(currentUser, data);
  const stationGroups = visible.map((s) => ({ key: s.id, name: s.name, count: groupMap[s.id]?.count || 0 }));
  const stationTargetsAll = selectedStation ? targets.filter((tg) => targetStationKey(tg) === selectedStation) : [];
  const allStationFolders = Array.from(new Set([
    ...folders.filter((f) => f.station_id === selectedStation).map((f) => f.path),
    ...stationTargetsAll.filter((tg) => tg.section).map((tg) => tg.section),
  ]));
  const allSectionFolders = allStationFolders.map((path) => ({ key: path, name: getLeafName(path) }));
  const selectedStationName = stationName(selectedStation);
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
      logAttestation={logAttestation} setLogAttestation={setLogAttestation}
      escalationSteps={escalationStepsFor(tg)}
      commentsOpen={commentsOpen} setCommentsOpen={setCommentsOpen} commentText={commentText} setCommentText={setCommentText} commentFiles={commentFiles} setCommentFiles={setCommentFiles} submitComment={submitComment}
      markIssue={markIssue} setMarkIssue={setMarkIssue}
      allSectionFolders={allSectionFolders} moveTaskToSection={moveTaskToSection} setEditTarget={(next) => { setEditStep(0); setEditTarget(next); }} deleteTarget={deleteTarget}
      taskLocked={!canManage(tg) && !isIndividual && (tg.completionMode || "onsite") === "onsite" && !checkedInToday}
      convertToRemote={convertToRemote}
      canChangeCompletionMode={canSetCompletionMode}
      completeTarget={completeTarget}
    />
  );

  return (
    <PullToRefresh onRefresh={async () => {
      // Full state reload: local fetches + tanstack-query caches + AuthContext store sync.
      await Promise.allSettled([fetchTargets(), fetchFolders(), queryClientInstance.invalidateQueries()]);
      refresh();
    }}>
    <div className="tasks-hub space-y-6">
      <PageHeader
        title={t("myTasks")}
        icon={Target}
      />

      {!isIndividual && !checkedInToday && (
        <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-800 font-body flex items-center gap-2"><ClipboardCheck className="w-4 h-4" /> {t("mustCheckInFirst")}</p>
          <Link to="/app/attendance" className="text-xs font-body text-accent hover:underline whitespace-nowrap">{t("goToAttendance")}</Link>
        </div>
      )}

      {/* Statistics overview */}
      {!targetsLoading && targets.length > 0 && <TaskStats targets={targets} t={t} />}

      {/* Period report (PDF / Excel) */}
      {targets.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowReport(!showReport)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${showReport ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            <FileText className="w-3.5 h-3.5" /> {lang === "ar" ? "تقرير المهام (PDF / Excel)" : "Tasks report (PDF / Excel)"}
          </button>
          {showReport && <TaskReportExport targets={targets} t={t} lang={lang} dir={dir} stationKeyOf={targetStationKey} defaultStation={selectedStation || "all"} />}
        </div>
      )}

      {!isIndividual && targets.some((tg) => tg.status === "active" && Array.isArray(tg.comments) && tg.comments.some((c) => c.is_rejection || c.is_dispute)) && (
        <EscalationInfoBox t={t} />
      )}

      {/* Unified Target form */}
      {showCreate && canCreateTasks(currentUser) && (
        <form id="task-create-form" ref={createFormRef} onSubmit={createTarget} className="mx-auto w-full max-w-3xl scroll-mt-6 rounded-2xl border border-accent/50 bg-secondary/60 p-3 shadow-soft sm:p-4">
          <TaskWizardStepper lang={lang} active={createStep} onSelect={setCreateStep} canSelect={canJumpCreate} />
          <div className="space-y-5 rounded-xl border border-accent/40 bg-card p-4 sm:p-6">
          <TaskFormStep index={0} active={createStep}>
          {prefilled && (
            <p className="text-[11px] font-body text-accent flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> {t("smartPrefill")}
            </p>
          )}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">{t("taskTitle")}</label>
              <input name="title" placeholder={t("taskTitle")} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm font-body focus:border-accent focus:ring-1 focus:ring-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">{t("taskDescription")}</label>
              <textarea name="description" rows={3} placeholder={t("taskDescription")} className="w-full resize-y rounded-lg border border-input px-3 py-2.5 text-sm font-body focus:border-accent focus:ring-1 focus:ring-accent" />
            </div>
          </div>

          {canSetCompletionMode && <CompletionModeToggle value={completionMode} onChange={setCompletionMode} lang={lang} />}

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
            </div>
          </div>

          </TaskFormStep>

          <TaskFormStep index={1} active={createStep}>
          {/* Assignment type selector — hidden for individuals (tasks are self-assigned) */}
          {!isIndividual && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("assignTo")}</p>
            <div className="flex flex-wrap gap-2">
              {[
                { val: "member", label: t("member"), icon: User },
                { val: "station_team", label: t("stationTeam"), icon: Users },
              ].map(({ val, label, icon: OptIcon }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAssignType(val)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${assignType === val ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
                >
                  <OptIcon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>
          )}
          <input type="hidden" name="assignType" value={assignType} />

          {/* Conditional assignment fields */}
          {assignType === "member" && (
            <div className="space-y-2">
              <div className="rounded-lg border border-accent/30 bg-secondary/50 px-3 py-2 text-sm font-medium">{stationName(formStation)}</div>
              <MemberMultiSelect
                lang={lang}
                members={memberCandidates.filter((e) => e.role === "employee" || e.role === "station_manager")}
                selected={assignedIds}
                onChange={(ids) => {
                  setAssignedIds(ids);
                  const emp = data.employees.find((x) => x.id === ids[0]);
                  if (emp) {
                    setEffortWeight(suggestEffortWeight(emp.profile?.position || emp.position || emp.role));
                    setWeightSuggested(true);
                  }
                }}
              />
            </div>
          )}

          {assignType === "station_team" && (
            <>
              <input type="hidden" name="stationId" value={formStation} />
              <div className="rounded-lg border border-accent/30 bg-secondary/50 px-3 py-2 text-sm font-medium">{stationName(formStation)}</div>
            </>
          )}


          {/* The task belongs to the section from which creation was opened. */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><FileText className="h-3.5 w-3.5" /> {t("section")}</p>
            <input type="hidden" name="section" value={sectionValue} />
            <div className="rounded-lg border border-accent/30 bg-secondary/50 px-3 py-2 text-sm font-medium">{getLeafName(sectionValue)}</div>
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

          </TaskFormStep>

          <TaskFormStep index={2} active={createStep}>
          {/* Effort weight — performance is scored on weight, not task count */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">⚖️ {lang === "ar" ? "وزن الجهد — يُحتسب الأداء على الوزن لا العدد" : "Effort weight — score counts weight, not count"}</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => { setEffortWeight(w); setWeightSuggested(false); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-body border transition ${effortWeight === w ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
                  title={EFFORT_WEIGHT_LABELS[w][lang === "ar" ? "ar" : "en"]}
                >
                  ×{w}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground font-body">
              {weightSuggested
                ? (lang === "ar" ? "وزن مقترح من المسمى الوظيفي — يمكنك تعديله قبل بدء العمل." : "Suggested from the job title — you can change it before work starts.")
                : (lang === "ar" ? "يُحدَّد الوزن قبل بدء العمل، ولا تُمنح النقاط إلا بعد اعتماد الإثبات." : "Weight is set before work starts; points are granted only after evidence approval.")}
            </p>
          </div>

          {/* Target quota */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("totalTasks")}</p>
            <input name="totalTasks" type="number" min="1" defaultValue="50" className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
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

          </TaskFormStep>

          <TaskFormStep index={3} active={createStep}>
            <div className="space-y-2 rounded-lg border border-accent/30 bg-secondary/40 p-4 text-sm font-body">
              <p className="text-xs uppercase tracking-wider text-accent">{lang === "ar" ? "مراجعة قبل الحفظ" : "Review before saving"}</p>
              <p>{lang === "ar" ? "القسم" : "Section"}: <span className="font-medium">{getLeafName(sectionValue) || "—"}</span></p>
              <p>{t("assignTo")}: <span className="font-medium">{assignType === "station_team" ? `${t("stationTeam")} — ${stationName(formStation)}` : t("member")}</span></p>
              <p>{t("priority")}: <span className="font-medium">{presetLabel(datePreset)} · {priority}</span></p>
              <p>{lang === "ar" ? "وزن الجهد" : "Effort weight"}: <span className="font-medium">×{effortWeight}</span></p>
              <p className="text-xs text-muted-foreground">{lang === "ar" ? "راجع الحقول في المراحل السابقة ثم احفظ." : "Check the earlier steps, then save."}</p>
            </div>
          </TaskFormStep>

          <TaskStepNav
            step={createStep}
            lastStep={3}
            setStep={setCreateStep}
            onNext={validateCreateStep}
            onCancel={() => { setShowCreate(false); setSectionValue(""); setCreateStep(0); }}
            lang={lang}
            dir={dir}
            submitting={isCreating}
            submitLabel={isCreating ? (lang === "ar" ? "جارٍ الحفظ..." : "Saving...") : t("save")}
          />
          </div>
        </form>
      )}

      {/* Task Targets — organized by station as a hierarchical folder tree */}
      <div className="space-y-4 rounded-xl border border-accent/25 bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
            {showArchive ? <Archive className="w-4 h-4" /> : <Target className="w-4 h-4" />} {showArchive ? t("smartArchive") : t("targets")}
          </h2>
          <button
            type="button"
            onClick={() => setShowArchive(!showArchive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${showArchive ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            <Archive className="w-3.5 h-3.5" /> {t("smartArchive")}
          </button>
        </div>

        {showArchive && (
          <p className="text-xs text-muted-foreground font-body -mt-2">{t("smartArchiveHint")}</p>
        )}

        <AnimatePresence mode="wait">
        {showArchive ? (
          <motion.div
            key="archive"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <SmartArchive targets={targets} renderTask={renderTask} t={t} lang={lang} dir={dir} />
          </motion.div>
        ) : targetsLoading ? (
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
                      <Radio className="w-4 h-4" />
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
            {!isIndividual && (
              <button
                onClick={() => { setSelectedStation(null); setFolderPath(null); setShowCreate(false); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground font-body hover:text-foreground"
              >
                <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} /> {t("back")}
              </button>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/25 bg-secondary/40 p-3">
              <h3 className="font-heading text-lg font-semibold">{isIndividual ? t("myTasks") : selectedStationName}</h3>

            </div>

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
                <StationSections
                  stationId={selectedStation}
                  currentPath={folderPath}
                  onNavigate={(path) => { setFolderPath(path); if (!path) setShowCreate(false); }}
                  folders={folders}
                  tasksAll={stationTargetsAll}
                  canManage={canCreateTasks(currentUser)}
                  renderTask={renderTask}
                  filterTasks={filterTasks}
                  onAddFolder={addFolderAt}
                  onRenameFolder={renameFolder}
                  onDeleteFolder={deleteFolder}
                  onCreateTask={(sectionPath) => openCreateForm(selectedStation, sectionPath)}
                  createOpen={showCreate}
                  t={t}
                  dir={dir}
                  lang={lang}
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
          <form ref={editFormRef} onClick={(e) => e.stopPropagation()} onSubmit={saveEdit} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-accent/50 bg-secondary/60 p-3 shadow-elevated sm:p-4">
            <div className="flex items-center justify-between px-2 pb-1">
              <h3 className="flex items-center gap-2 font-heading text-lg font-semibold"><Pencil className="h-4 w-4 text-accent" /> {t("editTask")}</h3>
              <button type="button" onClick={() => setEditTarget(null)} className="rounded-full border border-accent/30 bg-card p-1.5 hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <TaskWizardStepper
              lang={lang}
              active={editStep}
              onSelect={setEditStep}
              canSelect={canJumpEdit}
              steps={lang === "ar" ? ["تفاصيل المهمة", "الأولوية والمدة", "المراجعة"] : ["Task details", "Priority & duration", "Review"]}
            />
            <div className="space-y-5 rounded-xl border border-accent/40 bg-card p-4 sm:p-6">
            <TaskFormStep index={0} active={editStep}>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">{t("taskTitle")}</label>
              <input name="title" defaultValue={editTarget.title || ""} placeholder={t("taskTitle")} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm font-body focus:border-accent focus:ring-1 focus:ring-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">{t("taskDescription")}</label>
              <textarea name="description" rows={3} defaultValue={editTarget.description || ""} placeholder={t("taskDescription")} className="w-full resize-y rounded-lg border border-input px-3 py-2.5 text-sm font-body focus:border-accent focus:ring-1 focus:ring-accent" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">{t("section")}</label>
              <MobileSelect
                name="section"
                defaultValue={editTarget.section || ""}
                placeholder={t("sectionName")}
                options={allSectionFolders.map((section) => ({ value: section.key, label: section.name }))}
              />
            </div>
            <textarea name="steps" rows={3} defaultValue={editTarget.steps || ""} placeholder={t("stepsPlaceholder")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body resize-y" />
            {canSetCompletionMode && (
              <CompletionModeToggle
                value={editTarget.completionMode || "onsite"}
                onChange={(value) => setEditTarget((current) => ({ ...current, completionMode: value }))}
                lang={lang}
              />
            )}
            </TaskFormStep>

            <TaskFormStep index={1} active={editStep}>
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
                <input name="totalTasks" type="number" min="1" defaultValue={editTarget.task_target || 1} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-body block mb-1">⚖️ {lang === "ar" ? "وزن الجهد" : "Effort weight"}</label>
                <MobileSelect
                  key={`weight-${editTarget.id}`}
                  name="effortWeight"
                  defaultValue={String(editTarget.effortWeight || 1)}
                  placeholder="×1"
                  options={[1, 2, 3, 4, 5].map((w) => ({ value: String(w), label: `×${w}` }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">{t("endDate")}</label>
              <input name="endDate" type="date" defaultValue={editTarget.end_date ? new Date(editTarget.end_date).toISOString().slice(0, 10) : ""} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
            </div>
            </TaskFormStep>

            <TaskFormStep index={2} active={editStep}>
              <div className="space-y-2 rounded-lg border border-accent/30 bg-secondary/40 p-4 text-sm font-body">
                <p className="text-xs uppercase tracking-wider text-accent">{lang === "ar" ? "مراجعة قبل التحديث" : "Review before updating"}</p>
                <p>{t("taskTitle")}: <span className="font-medium">{editTarget.title || "—"}</span></p>
                <p>{t("section")}: <span className="font-medium">{getLeafName(editTarget.section || "") || "—"}</span></p>
                <p className="text-xs text-muted-foreground">{lang === "ar" ? "راجع الحقول في المراحل السابقة ثم حدّث." : "Check the earlier steps, then update."}</p>
              </div>
            </TaskFormStep>

            <TaskStepNav
              step={editStep}
              lastStep={2}
              setStep={setEditStep}
              onNext={validateEditStep}
              onCancel={() => setEditTarget(null)}
              lang={lang}
              dir={dir}
              submitLabel={t("update")}
            />
            </div>
          </form>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}