import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { getCompanyToken, syncPointsFromCloud } from "@/lib/store";
import {
  assignmentHistoryNote,
  canReassignOpsTask,
  canReviewOpsTask,
  isAwaitingApproval,
  isEscalated,
  isOverdue,
  latestAssignment,
  taskPoints,
} from "@/lib/opsDerivations";
import { canCreateTasks, visibleEmployees } from "@/lib/permissions";
import { buildOpsEscalationSteps, currentOpsLevelLabel } from "@/lib/opsEscalation";
import {
  approveLocalTask,
  buildLocalOpsBoard,
  createLocalOpsTask,
  logLocalCompletion,
  reassignLocalOpsTask,
  rejectLocalTask,
} from "@/lib/localOpsFallback";
import { isLocalPreviewActive } from "@/lib/localPreview";
import OpsNewTaskModal from "@/components/tasks/OpsNewTaskModal";
import OpsReassignModal from "@/components/tasks/OpsReassignModal";
import OpsTaskDetail from "@/components/tasks/OpsTaskDetail";
import OpsTasksTable from "@/components/tasks/OpsTasksTable";
import DailyTaskQuotaCard from "@/components/tasks/DailyTaskQuotaCard";
import OpsToolbarStrip from "@/components/tasks/OpsToolbarStrip";
import PlatformStampShell from "@/components/shared/PlatformStampShell";
import { INK, MUTED, BORDER, SURFACE, tableShell } from "@/lib/platformStyles";
import { toast } from "@/components/ui/use-toast";
import useStationScope from "@/hooks/useStationScope";
import { Link } from "react-router-dom";

const okBanner = {
  borderRadius: 16,
  border: "1px solid #BBF7D0",
  background: "#ECFDF3",
  padding: "12px 14px",
  fontSize: 13,
  color: "#15803D",
  lineHeight: 1.7,
};
const warnBanner = {
  ...okBanner,
  border: "1px solid #FDE68A",
  background: "#FFFBEB",
  color: "#B45309",
};

const HORIZON_LABEL = {
  y: { ar: "سنوية", en: "Annual" },
  h: { ar: "نصف سنوية", en: "Half-year" },
  q: { ar: "ربعية", en: "Quarterly" },
  m: { ar: "شهرية", en: "Monthly" },
  w: { ar: "أسبوعية", en: "Weekly" },
};

function localTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Operations console — counters and gates from
 * base44.functions.invoke("operations", …). No hardcoded KPI literals.
 */
export default function Operations() {
  const { lang, dir, t } = useI18n();
  const ar = lang === "ar";
  const { currentUser, company, data, refresh } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState(null);
  const [horizons, setHorizons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceDown, setServiceDown] = useState(false);
  const [localMode, setLocalMode] = useState(false);
  const [filter, setFilter] = useState("all");
  const headerScope = useStationScope();
  const scope = headerScope || "all";
  const [viewMode, setViewMode] = useState("list");
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejectFor, setRejectFor] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reassignFor, setReassignFor] = useState(null);
  const [checkedIn, setCheckedIn] = useState(null);
  const [attendanceGate, setAttendanceGate] = useState(null);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    stationId: "",
    ownerId: "",
    memberIds: [],
    assignMode: "one",
    priority: "medium",
    effortWeight: 3,
    workKind: "pm",
    dueAt: "",
    targetCount: 1,
    mode: "onsite",
    steps: "",
    planPinned: false,
    planHorizon: "w",
  });

  const ops = useCallback((payload) => base44.functions.invoke("operations", {
    ...payload,
    companyId: company?.id,
    sessionToken: company?.id ? getCompanyToken(company.id) : null,
    lang: ar ? "ar" : "en",
    scope: scope === "all" ? null : scope,
  }), [company?.id, ar, scope]);

  const applyLocalBoard = useCallback((scopeOverride) => {
    const board = buildLocalOpsBoard({
      tasks: data?.tasks || [],
      scope: scopeOverride ?? scope,
    });
    setTasks(board.tasks);
    setCounts(board.counts);
    setHorizons(board.horizons);
    setLocalMode(true);
    setServiceDown(false);
    // Local preview has no live attendance service — do not block the board behind a dead gate.
    if (isLocalPreviewActive()) {
      setCheckedIn(true);
      setAttendanceGate(null);
    }
    return board;
  }, [data?.tasks, scope]);

  const reload = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    const hasLocalTasks = Array.isArray(data?.tasks) && data.tasks.length > 0;
    const preferLocal = isLocalPreviewActive();
    try {
      if (preferLocal && hasLocalTasks) {
        applyLocalBoard();
        return;
      }
      const [listRes, attRes] = await Promise.all([
        ops({ action: "list" }),
        ops({ action: "attendanceStatus", employeeId: currentUser?.id || currentUser?.employeeId }),
      ]);
      const body = listRes?.data || listRes;
      const remoteTasks = Array.isArray(body?.tasks) ? body.tasks : [];
      if (!remoteTasks.length && hasLocalTasks) {
        applyLocalBoard();
        return;
      }
      setTasks(remoteTasks);
      setCounts(body?.counts || null);
      setHorizons(Array.isArray(body?.horizons) ? body.horizons : []);
      const attBody = attRes?.data || attRes || {};
      setCheckedIn(!!attBody.checkedIn);
      setAttendanceGate(attBody.gate || null);
      setServiceDown(false);
      setLocalMode(false);
    } catch {
      if (hasLocalTasks || preferLocal) {
        applyLocalBoard();
      } else {
        setServiceDown(true);
        setLocalMode(false);
        setTasks([]);
        setCounts(null);
        setHorizons([]);
      }
    } finally {
      setLoading(false);
    }
  }, [ops, company?.id, ar, currentUser?.id, currentUser?.employeeId, data?.tasks, applyLocalBoard]);

  useEffect(() => { reload(); }, [reload]);

  const stations = data?.stations || [];
  const employees = useMemo(() => {
    const all = data?.employees || [];
    if (!form.stationId) return all;
    return all.filter((e) => e.stationId === form.stationId);
  }, [data?.employees, form.stationId]);

  const openTask = tasks.find((t) => t.id === openTaskId) || null;
  const canReview = (task) => canReviewOpsTask(task, currentUser, data);
  const canReassign = (task) => canReassignOpsTask(task, currentUser, data);
  const canEditQuota = canCreateTasks(currentUser, data);
  const reassignCandidates = useMemo(() => {
    const visible = visibleEmployees(currentUser, data);
    const stationId = reassignFor?.stationId || openTask?.stationId;
    if (!stationId) return visible;
    return visible.filter((emp) => (emp.stationId || null) === stationId || (emp.managedStations || []).includes(stationId));
  }, [currentUser, data, reassignFor?.stationId, openTask?.stationId]);

  const finishCreateUi = (ref) => {
    toast({ title: ar ? "أُنشئت المهمة" : "Task created", description: ref });
    setForm((f) => ({
      ...f,
      title: "",
      memberIds: [],
      steps: "",
      ownerId: "",
      planPinned: false,
      planHorizon: "w",
    }));
    setShowCreate(false);
  };

  const createTask = async (e, attachFiles = []) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      title: form.title,
      stationId: form.stationId || null,
      ownerId: form.assignMode === "one" ? form.ownerId : null,
      memberIds: form.assignMode === "some" ? form.memberIds : [],
      assignMode: form.assignMode,
      priority: form.priority,
      effortWeight: form.effortWeight,
      workKind: form.workKind,
      dueAt: form.dueAt || null,
      targetCount: form.targetCount,
      mode: form.mode,
      steps: form.steps,
      planPinned: form.planPinned === true,
      planHorizon: form.planHorizon || null,
      attachments: [],
    };
    try {
      let attachments = [];
      if (!localMode && !isLocalPreviewActive()) {
        for (const file of attachFiles || []) {
          const up = await base44.integrations.Core.UploadFile({ file });
          attachments.push({ url: up.file_url, name: file.name });
        }
      } else {
        attachments = (attachFiles || []).map((f) => ({ url: "", name: f.name, localOnly: true }));
      }
      payload.attachments = attachments;

      if (localMode || isLocalPreviewActive()) {
        const board = createLocalOpsTask(company.id, payload, { employees: data?.employees || [] });
        setTasks(buildLocalOpsBoard({ tasks: board.tasks, scope }).tasks);
        setCounts(board.counts);
        setHorizons(board.horizons);
        finishCreateUi(board.tasks?.[0]?.ref);
        await refresh?.();
        return;
      }

      const res = await ops({ action: "create", ...payload });
      const body = res?.data ?? res ?? {};
      if (body.error === "ASSIGN_GATE") {
        toast({ title: ar ? "بوابة الإسناد" : "Assignment gate", description: body.reason || body.error, variant: "destructive" });
        return;
      }
      if (body.error) {
        toast({ title: ar ? "رُفض الإنشاء" : "Create blocked", description: body.reason || body.error, variant: "destructive" });
        return;
      }
      finishCreateUi(body?.task?.ref);
      setCounts(body.counts || null);
      await reload();
    } catch (err) {
      if (company?.id && (isLocalPreviewActive() || localMode || Array.isArray(data?.tasks))) {
        try {
          const board = createLocalOpsTask(company.id, payload, { employees: data?.employees || [] });
          setTasks(buildLocalOpsBoard({ tasks: board.tasks, scope }).tasks);
          setCounts(board.counts);
          setHorizons(board.horizons);
          setLocalMode(true);
          finishCreateUi(board.tasks?.[0]?.ref);
          await refresh?.();
          return;
        } catch {
          /* fall through */
        }
      }
      const dataErr = err?.response?.data || err?.data || {};
      toast({
        title: dataErr.error === "ASSIGN_GATE" ? (ar ? "بوابة الإسناد" : "Assignment gate") : (ar ? "رُفض الإنشاء" : "Create blocked"),
        description: dataErr.reason || dataErr.error || err?.message || "",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const logDone = async (task, opts = {}) => {
    setBusy(true);
    try {
      let proofFiles = [];
      const file = opts.proofFile || null;
      if (file && !localMode && !isLocalPreviewActive()) {
        const up = await base44.integrations.Core.UploadFile({ file });
        proofFiles = [{ url: up.file_url, name: file.name }];
      } else if (file) {
        proofFiles = [{ url: "", name: file.name, localOnly: true }];
      }
      const attestation = opts.attestation != null
        ? opts.attestation
        : (proofFiles.length
          ? ""
          : (ar ? `إفادة إنجاز بواسطة ${currentUser?.name || "المستخدم"}` : `Completion attested by ${currentUser?.name || "user"}`));
      if (!proofFiles.length && !String(attestation || "").trim()) {
        toast({
          title: ar ? "بوابة الإثبات" : "Proof gate",
          description: ar ? "لا نقطة بلا أثر — أرفق صورة أو اكتب إفادة أولًا" : "No point without a trace — attach a photo or write an attestation first",
          variant: "destructive",
        });
        return;
      }
      const amount = Math.max(1, Number(opts.amount) || 1);
      if (localMode || isLocalPreviewActive()) {
        const board = logLocalCompletion(company.id, task.id, { amount, attestation, proofFiles });
        setTasks(buildLocalOpsBoard({ tasks: board.tasks, scope }).tasks);
        setCounts(board.counts);
        setHorizons(board.horizons);
        await refresh?.();
        return;
      }
      const res = await ops({
        action: "logCompletion",
        taskId: task.id,
        amount,
        proofFiles,
        attestation,
      });
      const body = res?.data || res;
      if (body?.error === "CHECK_IN_REQUIRED") {
        toast({ title: ar ? "بوابة الحضور" : "Attendance gate", description: body.reason || body.error, variant: "destructive" });
        return;
      }
      if (body?.error) throw new Error(body.reason || body.error);
      setCounts(body.counts || null);
      await reload();
    } catch (err) {
      if (company?.id && (isLocalPreviewActive() || localMode)) {
        try {
          const attestation = opts.attestation || (ar ? `إفادة إنجاز بواسطة ${currentUser?.name || "المستخدم"}` : `Completion attested by ${currentUser?.name || "user"}`);
          const board = logLocalCompletion(company.id, task.id, {
            amount: Math.max(1, Number(opts.amount) || 1),
            attestation,
            proofFiles: [],
          });
          setTasks(buildLocalOpsBoard({ tasks: board.tasks, scope }).tasks);
          setCounts(board.counts);
          setHorizons(board.horizons);
          await refresh?.();
          return;
        } catch {
          /* fall through */
        }
      }
      const dataErr = err?.response?.data || err?.data || {};
      toast({
        title: dataErr.error === "CHECK_IN_REQUIRED" ? (ar ? "بوابة الحضور" : "Attendance gate") : (ar ? "فشل التسجيل" : "Log failed"),
        description: dataErr.reason || dataErr.error || err.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const addComment = async (task, text, isIssue) => {
    setBusy(true);
    try {
      const res = await ops({ action: "addComment", taskId: task.id, text, isIssue });
      const body = res?.data || res;
      if (body?.error) throw new Error(body.reason || body.error);
      await reload();
    } catch (err) {
      toast({ title: ar ? "فشل التعليق" : "Comment failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const addAttachment = async (task, file) => {
    if (!file) return;
    setBusy(true);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      const res = await ops({ action: "addAttachment", taskId: task.id, url: up.file_url, name: file.name });
      const body = res?.data || res;
      if (body?.error) throw new Error(body.reason || body.error);
      await reload();
    } catch (err) {
      toast({ title: ar ? "فشل المرفق" : "Attachment failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const setMode = async (task, mode) => {
    setBusy(true);
    try {
      const res = await ops({ action: "setTaskMode", taskId: task.id, mode });
      const body = res?.data || res;
      if (body?.error) throw new Error(body.reason || body.error);
      await reload();
    } catch (err) {
      toast({ title: ar ? "تعذّر تغيير النمط" : "Mode change failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const approve = async (task) => {
    if (!canReview(task)) {
      toast({
        title: ar ? "ليس مستواك" : "Not your level",
        description: ar
          ? "بعد الرفض تنتقل المراجعة للمستوى التالي في سلسلة التصعيد."
          : "After a reject, review moves to the next escalation level.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      if (localMode || isLocalPreviewActive()) {
        const body = approveLocalTask(company.id, task.id);
        setTasks(buildLocalOpsBoard({ tasks: body.tasks, scope }).tasks);
        setCounts(body.counts);
        setHorizons(body.horizons);
        await refresh?.();
        toast({
          title: ar ? "اعتُمد الإنجاز" : "Approved",
          description: ar
            ? `مُنحت ${body?.awarded?.points ?? taskPoints(task.priority, task.effortWeight)} نقطة — تظهر في الأداء`
            : `Granted ${body?.awarded?.points ?? taskPoints(task.priority, task.effortWeight)} points — visible in Performance`,
        });
        return;
      }
      const res = await ops({ action: "approve", taskId: task.id });
      const body = res?.data || res;
      if (body?.error) throw new Error(body.reason || body.error);
      if (company?.id) await syncPointsFromCloud(company.id);
      await refresh?.();
      toast({
        title: ar ? "اعتُمد الإنجاز" : "Approved",
        description: ar
          ? `مُنحت ${body?.awarded?.points ?? taskPoints(task.priority, task.effortWeight)} نقطة — تظهر في الأداء`
          : `Granted ${body?.awarded?.points ?? taskPoints(task.priority, task.effortWeight)} points — visible in Performance`,
      });
      setCounts(body.counts || null);
      await reload();
    } catch (err) {
      if (company?.id && (isLocalPreviewActive() || localMode)) {
        try {
          const body = approveLocalTask(company.id, task.id);
          setTasks(buildLocalOpsBoard({ tasks: body.tasks, scope }).tasks);
          setCounts(body.counts);
          setHorizons(body.horizons);
          await refresh?.();
          toast({
            title: ar ? "اعتُمد الإنجاز" : "Approved",
            description: ar
              ? `مُنحت ${body?.awarded?.points ?? taskPoints(task.priority, task.effortWeight)} نقطة — تظهر في الأداء`
              : `Granted ${body?.awarded?.points ?? taskPoints(task.priority, task.effortWeight)} points — visible in Performance`,
          });
          return;
        } catch {
          /* fall through */
        }
      }
      toast({ title: ar ? "فشل الاعتماد" : "Approve failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toastRejectOutcome = (escalation) => {
    if (escalation?.escalate) {
      toast({
        title: ar ? "رُفض وصُعّد" : "Rejected and escalated",
        description: ar
          ? "الرفض مكتوب في السجل، والمراجعة انتقلت للمستوى التالي في سلسلة التصعيد."
          : "The written reject is on the trail, and review moved to the next escalation level.",
      });
      return;
    }
    toast({
      title: ar ? "أُعيدت للمنفّذ" : "Returned to executor",
      description: ar
        ? "وصلت أعلى سلسلة التصعيد — أُعيدت المهمة للمنفّذ لإثبات أوضح."
        : "Top of the escalation chain — returned to the executor for clearer proof.",
    });
  };

  const reject = async (taskOverride, reasonOverride) => {
    const target = taskOverride || rejectFor;
    const reason = String(reasonOverride ?? rejectReason).trim();
    if (!target || !reason) return;
    setBusy(true);
    try {
      if (localMode || isLocalPreviewActive()) {
        const body = rejectLocalTask(company.id, target.id, reason, { reviewer: currentUser, data });
        setTasks(buildLocalOpsBoard({ tasks: body.tasks, scope }).tasks);
        setCounts(body.counts);
        setHorizons(body.horizons);
        toastRejectOutcome(body.escalation);
        setRejectFor(null);
        setRejectReason("");
        await refresh?.();
        return;
      }
      const res = await ops({ action: "reject", taskId: target.id, reason });
      const body = res?.data || res;
      if (body?.error) throw new Error(body.reason || body.error);
      toastRejectOutcome(body.escalation);
      setRejectFor(null);
      setRejectReason("");
      setCounts(body.counts || null);
      await reload();
    } catch (err) {
      if (company?.id && (isLocalPreviewActive() || localMode || Array.isArray(data?.tasks))) {
        try {
          const body = rejectLocalTask(company.id, target.id, reason, { reviewer: currentUser, data });
          setTasks(buildLocalOpsBoard({ tasks: body.tasks, scope }).tasks);
          setCounts(body.counts);
          setHorizons(body.horizons);
          setLocalMode(true);
          toastRejectOutcome(body.escalation);
          setRejectFor(null);
          setRejectReason("");
          await refresh?.();
          return;
        } catch {
          /* fall through */
        }
      }
      toast({ title: ar ? "فشل الرفض" : "Reject failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const applyLocalReassign = (task, { toId, reason }) => {
    const board = reassignLocalOpsTask(company.id, task.id, {
      toId,
      reason,
      reviewer: currentUser,
      data,
      employees: reassignCandidates,
      lang: ar ? "ar" : "en",
      task,
    });
    setTasks(buildLocalOpsBoard({ tasks: board.tasks, scope }).tasks);
    setCounts(board.counts);
    setHorizons(board.horizons);
    setReassignFor(null);
    return board;
  };

  const reassign = async (task, { toId, reason }) => {
    if (!task || !toId || !String(reason || "").trim()) return;
    setBusy(true);
    const preview = isLocalPreviewActive() || localMode;
    try {
      if (preview) {
        applyLocalReassign(task, { toId, reason });
        await refresh?.();
        toast({ title: ar ? "وُكِّلت المهمة" : "Task delegated" });
        return;
      }
      const res = await ops({ action: "reassign", taskId: task.id, toId, reason });
      const body = res?.data || res;
      if (body?.error) {
        const err = new Error(body.reason || body.error);
        err.status = res?.status || 400;
        err.code = body.error;
        throw err;
      }
      setCounts(body.counts || null);
      setReassignFor(null);
      toast({ title: ar ? "وُكِّلت المهمة" : "Task delegated" });
      await reload();
    } catch (err) {
      const code = err?.code || err?.response?.data?.error || "";
      const assignBlocked = code === "ASSIGN_GATE";
      // 401/403 from Base44, missing action, or preview: persist via the same
      // local tasks fallback as create. Do not retry a competency assign-gate.
      if (company?.id && !assignBlocked) {
        try {
          applyLocalReassign(task, { toId, reason });
          setLocalMode(true);
          await refresh?.();
          toast({ title: ar ? "وُكِّلت المهمة" : "Task delegated" });
          return;
        } catch (localErr) {
          toast({
            title: ar ? "تعذّر التوكيل" : "Delegation failed",
            description: localErr.message,
            variant: "destructive",
          });
          return;
        }
      }
      toast({
        title: ar ? "تعذّر التوكيل" : "Delegation failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const todayKey = localTodayKey();
  const visible = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "overdue") return isOverdue(t);
    if (filter === "today") return t.dueAt && String(t.dueAt).slice(0, 10) === todayKey;
    if (filter === "awaiting") return isAwaitingApproval(t);
    if (filter === "escalated") return isEscalated(t);
    if (filter === "done") return t.status === "completed" || !!t.approvedAt;
    return true;
  });

  const c = counts;
  const chips = c ? [
    { id: "all", label: ar ? `الكل · ${c.total}` : `All · ${c.total}` },
    { id: "overdue", label: ar ? `متأخرة · ${c.overdue}` : `Overdue · ${c.overdue}` },
    { id: "today", label: ar ? `اليوم · ${c.today}` : `Today · ${c.today}` },
    { id: "awaiting", label: ar ? `بانتظار الاعتماد · ${c.awaiting}` : `Awaiting · ${c.awaiting}` },
    { id: "escalated", label: ar ? `صُعّدت · ${c.escalated || 0}` : `Escalated · ${c.escalated || 0}` },
    { id: "done", label: ar ? `مكتملة · ${c.done}` : `Done · ${c.done}` },
  ] : [];

  const KIND_LABEL = {
    pm: { ar: "وقائية", en: "PM" },
    cm: { ar: "تصحيحية", en: "CM" },
    em: { ar: "طارئة", en: "EM" },
    pr: { ar: "مشروع", en: "PR" },
    cp: { ar: "امتثال", en: "CP" },
  };
  const STATUS_LABEL = {
    active: { ar: "نشطة", en: "Active" },
    awaiting_approval: { ar: "بانتظار الاعتماد", en: "Awaiting" },
    completed: { ar: "مكتملة", en: "Done" },
    pending_review: { ar: "مراجعة", en: "Review" },
  };
  const priColor = (p) => (p === "high" || p === "urgent" ? "#DC2626" : p === "low" ? "#94A3B8" : "#F59E0B");
  const stationName = (id) => stations.find((s) => s.id === id)?.name || "—";
  const ownerName = (task) => {
    const id = task.ownerId || task.employee_id;
    const emp = (data?.employees || []).find((e) => e.id === id || e.employeeId === id);
    return emp?.name || task.ownerName || "—";
  };
  const ownerInitials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
  const statusChip = (status) => {
    if (status === "completed") {
      return { display: "inline-block", padding: "3px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: 500, background: "#ECFDF3", color: "#15803D", border: "1px solid #BBF7D0", whiteSpace: "nowrap" };
    }
    if (status === "awaiting_approval" || status === "pending_review") {
      return { display: "inline-block", padding: "3px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: 500, background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", whiteSpace: "nowrap" };
    }
    return { display: "inline-block", padding: "3px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: 500, background: SURFACE, color: MUTED, border: "1px solid #E2E8F0", whiteSpace: "nowrap" };
  };

  const kindStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "8px",
    fontSize: "11px",
    background: SURFACE,
    color: MUTED,
    border: "1px solid #E2E8F0",
  };

  const planGroups = (horizons.length ? horizons : ["y", "h", "q", "m", "w"].map((id) => ({ id, count: 0, pct: 0, unitsDone: 0, unitsTarget: 0 })))
    .map((h) => ({
      ...h,
      rows: visible.filter((t) => (t.planHorizon || "w") === h.id),
    }));

  const renderActions = (task) => {
    const logBlocked = task.mode !== "remote" && checkedIn === false;
    return (
      <div className="flex flex-col items-start gap-1">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setOpenTaskId(task.id)} className="rounded-lg border border-[#1E9E63]/40 bg-[#EAF6EF] px-2.5 py-1 text-[11px] font-medium text-[#14683F]">
            {ar ? "بطاقة" : "Card"}
          </button>
          {task.status !== "completed" && task.mode !== "remote" && (
            <button type="button" disabled={busy} onClick={() => setMode(task, "remote")} className="rounded-lg border border-[#E2E8F0] px-2.5 py-1 text-[11px] text-[#5A6B85]">
              {ar ? "عن بُعد" : "Remote"}
            </button>
          )}
          {task.status !== "completed" && task.mode === "remote" && (
            <button type="button" disabled={busy} onClick={() => setMode(task, "onsite")} className="rounded-lg border border-[#E2E8F0] px-2.5 py-1 text-[11px] text-[#5A6B85]">
              {ar ? "حضوري" : "On-site"}
            </button>
          )}
          {task.status !== "completed" && !isAwaitingApproval(task) && (
            <button
              type="button"
              disabled={busy || logBlocked}
              onClick={() => logDone(task)}
              className="rounded-lg border border-[#E2E8F0] px-2.5 py-1 text-[11px] font-medium text-[#14284B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ar ? "سجّل" : "Log"}
            </button>
          )}
          {canReassign(task) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setReassignFor(task)}
              className="rounded-lg border border-[#E2E8F0] px-2.5 py-1 text-[11px] font-medium text-[#14284B]"
            >
              {ar ? "توكيل" : "Delegate"}
            </button>
          )}
          {isAwaitingApproval(task) && canReview(task) && (
            <>
              <button type="button" disabled={busy} onClick={() => approve(task)} className="rounded-lg bg-[#1E9E63] px-2.5 py-1 text-[11px] font-semibold text-white">
                {ar ? "اعتمد" : "Approve"}
              </button>
              <button type="button" disabled={busy} onClick={() => { setRejectFor(task); setRejectReason(""); }} className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1 text-[11px] text-[#B91C1C]">
                {ar ? "رفض" : "Reject"}
              </button>
            </>
          )}
        </div>
        {logBlocked && task.status !== "completed" && !isAwaitingApproval(task) && (
          <span className="max-w-[220px] text-[10px] leading-snug text-[#B45309]">
            {attendanceGate?.reason || (ar ? "موقوف حتى بصمة اليوم" : "Blocked until today's check-in")}
          </span>
        )}
      </div>
    );
  };

  return (
    <PlatformStampShell
      ar={ar}
      title={ar ? "المهام والعمليات" : "Tasks & operations"}
      hint={
        c
          ? (ar
            ? `${c.active} نشطة · ${c.overdue + c.awaiting} تحتاج متابعة · نقاط معتمدة ${c.pointsAwarded} — الحضور يفتح المهمة، والاعتماد يمنح النقاط.`
            : `${c.active} active · ${c.overdue + c.awaiting} need follow-up · awarded points ${c.pointsAwarded} — attendance opens the task; review awards the points.`)
          : (ar ? "تُحمَّل العدّادات من الخادم…" : "Loading counters from server…")
      }
      maxWidth={1280}
    >
      <div className="space-y-3.5">

      <OpsToolbarStrip
        ar={ar}
        dir={dir}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filter={filter}
        onFilterChange={setFilter}
        chips={chips}
        showCreate={showCreate}
        onToggleCreate={() => setShowCreate((v) => !v)}
      />

      <DailyTaskQuotaCard
        ar={ar}
        tasks={tasks}
        data={data}
        companyId={company?.id}
        stationId={scope}
        canEdit={canEditQuota}
        onSaved={() => refresh?.()}
      />

      <div style={checkedIn ? okBanner : warnBanner}>
        {checkedIn
          ? (ar ? "حضور اليوم مسجَّل — يمكنك تسجيل إنجاز المهام الحضورية." : "Checked in today — you can log on-site task completion.")
          : (attendanceGate?.reason || (ar
            ? "تسجيل الإنجاز الميداني موقوف حتى بصمة اليوم — سجّل حضورك من شاشة الحضور، أو اطلب تحويل المهمة إلى عن بُعد."
            : "On-site logging is blocked until today's check-in — use Attendance, or ask to switch the task to remote."))}
        {!checkedIn && (
          <Link to="/app/attendance" className="ms-2 underline font-medium">
            {ar ? "الحضور" : "Attendance"}
          </Link>
        )}
      </div>

      {showCreate && (
        <OpsNewTaskModal
          ar={ar}
          dir={dir}
          form={form}
          setForm={setForm}
          stations={stations}
          employees={employees}
          busy={busy}
          onClose={() => setShowCreate(false)}
          onSubmit={createTask}
        />
      )}

      {localMode && (
        <div style={okBanner}>
          <span className="font-semibold">{ar ? "وضع محلي · " : "Local mode · "}</span>
          {ar
            ? "خدمة العمليات السحابية غير متاحة — تُعرض المهام من سجل الشركة المحلي مع نفس قواعد الوزن والنقاط. التغييرات تُحفظ محليًا حتى يعود الربط."
            : "Cloud operations is unavailable — tasks are shown from the local company register with the same weight→points rules. Changes stay local until the service reconnects."}
        </div>
      )}
      {serviceDown && !localMode && (
        <div style={warnBanner}>
          <span className="font-semibold">{ar ? "لوحة المهام غير متصلة · " : "Task board offline · "}</span>
          {ar
            ? "لم تستجب خدمة العمليات، فلا تُعرض المهام ولا تُقبل الإفادات أو الاعتمادات. القائمة الفارغة أدناه ليست انعدام عمل مسند."
            : "The operations service did not respond, so no tasks are shown and no attestation or approval is accepted. The empty list below does not mean no work is assigned."}
        </div>
      )}

      {viewMode === "plan" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: "11px", color: MUTED, lineHeight: 1.65, textWrap: "pretty" }}>
            {ar
              ? "الخطة أفق زمني مشتق من الاستحقاق — المهمة تظهر في قائمتها وفي مجموعتها دون نسخ سجلين."
              : "Plan is a horizon derived from due date — each task appears in its list and group without duplicate records."}
          </div>
          {planGroups.map((g) => (
            <div key={g.id} style={tableShell}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 18px",
                borderBottom: `1px solid ${BORDER}`,
                flexWrap: "wrap",
              }}
              >
                <div style={{ flex: "1 1 200px", fontSize: "13px", fontWeight: 600, color: INK }}>
                  {ar ? HORIZON_LABEL[g.id]?.ar : HORIZON_LABEL[g.id]?.en}
                </div>
                <div style={{ fontSize: "11px", color: MUTED }}>
                  {ar ? `${g.rows.length} مهام` : `${g.rows.length} tasks`}
                </div>
                <div dir="ltr" style={{ fontSize: "11px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right" }}>
                  {g.unitsDone}/{g.unitsTarget}
                </div>
                <span style={{ width: "96px", height: "5px", borderRadius: "4px", background: SURFACE, overflow: "hidden" }}>
                  <span style={{ display: "block", width: `${g.pct || 0}%`, height: "100%", background: "#1E9E63", borderRadius: "4px" }} />
                </span>
                <span dir="ltr" style={{ fontSize: "11px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif", width: "34px", textAlign: "right" }}>
                  {g.pct || 0}%
                </span>
              </div>
              {g.rows.length === 0 ? (
                <div style={{ padding: "16px 18px", fontSize: "12px", color: MUTED }}>
                  {ar ? "لا مهام في هذا الأفق ضمن التصفية." : "No tasks in this horizon for the current filter."}
                </div>
              ) : (
                g.rows.map((task) => {
                  const owner = ownerName(task);
                  return (
                    <div
                      key={task.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenTaskId(task.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpenTaskId(task.id); }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#F7F8FA"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 18px",
                        borderBottom: "1px solid #F1F5F9",
                        cursor: "pointer",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: priColor(task.priority), flexShrink: 0 }} />
                      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: INK }}>{task.title}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "11px", color: MUTED, fontFamily: "'IBM Plex Mono',monospace" }} dir="ltr">{task.ref}</span>
                          <span style={kindStyle}>
                            {ar ? KIND_LABEL[task.workKind]?.ar : KIND_LABEL[task.workKind]?.en || task.workKind}
                          </span>
                          <span style={{ fontSize: "11px", color: MUTED }}>{stationName(task.stationId)} · {owner}</span>
                          {latestAssignment(task) && (
                            <span style={{ fontSize: "11px", color: MUTED }}>
                              {assignmentHistoryNote(latestAssignment(task), ar ? "ar" : "en")}
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", color: MUTED }}>{task.dueAt ? String(task.dueAt).slice(0, 10) : "—"}</span>
                      <span style={statusChip(task.status)}>
                        {ar ? STATUS_LABEL[task.status]?.ar : STATUS_LABEL[task.status]?.en || task.status}
                      </span>
                      <span dir="ltr" style={{ fontSize: "11px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right" }}>
                        {task.completedCount}/{task.targetCount}
                      </span>
                      <div onClick={(e) => e.stopPropagation()}>{renderActions(task)}</div>
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      ) : (
        <OpsTasksTable
          tasks={visible}
          lang={lang}
          loading={loading}
          serviceDown={serviceDown && !localMode}
          stationName={stationName}
          ownerName={ownerName}
          ownerInitials={ownerInitials}
          onOpen={(task) => setOpenTaskId(task.id)}
        />
      )}

      {openTask && (
        <OpsTaskDetail
          task={{ ...openTask, ownerName: ownerName(openTask), stationName: stationName(openTask.stationId) }}
          ar={ar}
          busy={busy}
          canManage={canReview(openTask)}
          canReassign={canReassign(openTask)}
          checkedIn={checkedIn}
          attendanceGate={attendanceGate}
          escalationSteps={buildOpsEscalationSteps(openTask, data, t, lang)}
          currentLevelLabel={currentOpsLevelLabel(openTask, data, t, lang)}
          t={t}
          lang={lang}
          onClose={() => setOpenTaskId(null)}
          onLog={(opts) => logDone(openTask, opts)}
          onApprove={() => approve(openTask)}
          onReject={(reason) => reject(openTask, reason)}
          onAddComment={(text, isIssue) => addComment(openTask, text, isIssue)}
          onAddAttachment={(file) => addAttachment(openTask, file)}
          onOpenReassign={() => setReassignFor(openTask)}
        />
      )}

      {reassignFor && (
        <OpsReassignModal
          task={reassignFor}
          ar={ar}
          employees={reassignCandidates}
          busy={busy}
          onClose={() => setReassignFor(null)}
          onConfirm={(payload) => reassign(reassignFor, payload)}
        />
      )}

      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
            <div className="text-sm font-semibold">{ar ? "سبب الرفض" : "Rejection reason"}</div>
            <p className="mt-1 text-[11px] leading-6 text-[#5A6B85]">
              {ar
                ? "الرفض يُسجَّل ويُصعَّد للمستوى التالي في سلسلة التصعيد. إن وصلت أعلى السلسلة تُعاد للمنفّذ."
                : "Reject is recorded and escalates to the next level. At the top of the chain it returns to the executor."}
            </p>
            <textarea className="mt-2 w-full rounded-lg border border-[#E2E8F0] p-2 text-sm" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setRejectFor(null)} className="rounded-lg border px-3 py-1.5 text-xs">{ar ? "إلغاء" : "Cancel"}</button>
              <button type="button" disabled={busy || !rejectReason.trim()} onClick={() => reject()} className="rounded-lg bg-[#14284B] px-3 py-1.5 text-xs text-white disabled:opacity-50">
                {ar ? "رفض وتصعيد" : "Reject & escalate"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PlatformStampShell>
  );
}
