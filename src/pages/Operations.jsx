import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { getCompanyToken, syncPointsFromCloud } from "@/lib/store";
import {
  CERT_FOR,
  CERT_LABELS,
  checkAssignGate,
  dayDiffFromToday,
  isAwaitingApproval,
  isOverdue,
  planHorizonFromDue,
  taskPoints,
} from "@/lib/opsDerivations";
import OpsTaskDetail from "@/components/tasks/OpsTaskDetail";
import { toast } from "@/components/ui/use-toast";

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
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const { currentUser, company, data, refresh } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState(null);
  const [horizons, setHorizons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [scope, setScope] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejectFor, setRejectFor] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [proofFile, setProofFile] = useState(null);
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
  });

  const ops = useCallback((payload) => base44.functions.invoke("operations", {
    ...payload,
    companyId: company?.id,
    sessionToken: company?.id ? getCompanyToken(company.id) : null,
    lang: ar ? "ar" : "en",
    scope: scope === "all" ? null : scope,
  }), [company?.id, ar, scope]);

  const reload = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [listRes, attRes] = await Promise.all([
        ops({ action: "list" }),
        ops({ action: "attendanceStatus", employeeId: currentUser?.id || currentUser?.employeeId }),
      ]);
      const body = listRes?.data || listRes;
      setTasks(Array.isArray(body?.tasks) ? body.tasks : []);
      setCounts(body?.counts || null);
      setHorizons(Array.isArray(body?.horizons) ? body.horizons : []);
      const attBody = attRes?.data || attRes || {};
      setCheckedIn(!!attBody.checkedIn);
      setAttendanceGate(attBody.gate || null);
    } catch (e) {
      toast({ title: ar ? "تعذّر تحميل المهام" : "Failed to load tasks", description: e?.message || "", variant: "destructive" });
      setTasks([]);
      setCounts(null);
      setHorizons([]);
    } finally {
      setLoading(false);
    }
  }, [ops, company?.id, ar, currentUser?.id, currentUser?.employeeId]);

  useEffect(() => { reload(); }, [reload]);

  const stations = data?.stations || [];
  const employees = useMemo(() => {
    const all = data?.employees || [];
    if (!form.stationId) return all;
    return all.filter((e) => e.stationId === form.stationId);
  }, [data?.employees, form.stationId]);

  const gatePeople = useMemo(() => {
    const mapEmp = (e) => ({
      employeeId: e.employeeId || e.id,
      name: e.name,
      certificates: Array.isArray(e.certificates) ? e.certificates : [],
    });
    if (form.assignMode === "all") {
      return (data?.employees || []).filter((e) => e.stationId === form.stationId).map(mapEmp);
    }
    return (data?.employees || []).map(mapEmp);
  }, [data?.employees, form.assignMode, form.stationId]);

  const clientGate = useMemo(() => checkAssignGate({
    workKind: form.workKind,
    assignMode: form.assignMode,
    ownerId: form.ownerId,
    memberIds: form.memberIds,
    stationId: form.stationId,
    people: gatePeople,
    lang: ar ? "ar" : "en",
  }), [form.workKind, form.assignMode, form.ownerId, form.memberIds, form.stationId, gatePeople, ar]);

  const reqCert = CERT_FOR[form.workKind] || null;
  const reqCertLabel = reqCert ? (CERT_LABELS[reqCert]?.[ar ? "ar" : "en"] || reqCert) : null;
  /** Named certificate lapse only — empty owner is a normal form required field, not a silent cert block. */
  const certBlocked = Array.isArray(clientGate.blocked) && clientGate.blocked.length > 0;
  const derivedHorizon = planHorizonFromDue(form.dueAt || null);
  const openTask = tasks.find((t) => t.id === openTaskId) || null;
  const isManager = ["owner", "director", "ops_manager", "station_manager", "pgm", "admin"].includes(currentUser?.role)
    || currentUser?.isOwner || currentUser?.admin;

  const createTask = async (e) => {
    e.preventDefault();
    if (certBlocked) {
      toast({ title: ar ? "بوابة الإسناد" : "Assignment gate", description: clientGate.reason, variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const res = await ops({
        action: "create",
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
      });
      const body = res?.data ?? res ?? {};
      if (body.error === "ASSIGN_GATE") {
        toast({ title: ar ? "بوابة الإسناد" : "Assignment gate", description: body.reason || body.error, variant: "destructive" });
        return;
      }
      if (body.error) {
        toast({ title: ar ? "رُفض الإنشاء" : "Create blocked", description: body.reason || body.error, variant: "destructive" });
        return;
      }
      toast({ title: ar ? "أُنشئت المهمة" : "Task created", description: body?.task?.ref });
      setForm((f) => ({ ...f, title: "", memberIds: [], steps: "", ownerId: "" }));
      setCounts(body.counts || null);
      await reload();
    } catch (err) {
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
      const file = opts.proofFile || proofFile;
      if (file) {
        const up = await base44.integrations.Core.UploadFile({ file });
        proofFiles = [{ url: up.file_url, name: file.name }];
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
      const res = await ops({
        action: "logCompletion",
        taskId: task.id,
        amount: Math.max(1, Number(opts.amount) || 1),
        proofFiles,
        attestation,
      });
      const body = res?.data || res;
      if (body?.error === "CHECK_IN_REQUIRED") {
        toast({ title: ar ? "بوابة الحضور" : "Attendance gate", description: body.reason || body.error, variant: "destructive" });
        return;
      }
      if (body?.error) throw new Error(body.reason || body.error);
      setProofFile(null);
      setCounts(body.counts || null);
      await reload();
    } catch (err) {
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
    setBusy(true);
    try {
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
      toast({ title: ar ? "فشل الاعتماد" : "Approve failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!rejectFor || !rejectReason.trim()) return;
    setBusy(true);
    try {
      const res = await ops({ action: "reject", taskId: rejectFor.id, reason: rejectReason.trim() });
      const body = res?.data || res;
      if (body?.error) throw new Error(body.reason || body.error);
      toast({ title: ar ? "أُعيدت للمنفّذ" : "Returned to executor" });
      setRejectFor(null);
      setRejectReason("");
      setCounts(body.counts || null);
      await reload();
    } catch (err) {
      toast({ title: ar ? "فشل الرفض" : "Reject failed", description: err.message, variant: "destructive" });
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
    if (filter === "done") return t.status === "completed" || !!t.approvedAt;
    return true;
  });

  const c = counts;
  const chips = c ? [
    { id: "all", label: ar ? `الكل · ${c.total}` : `All · ${c.total}` },
    { id: "overdue", label: ar ? `متأخرة · ${c.overdue}` : `Overdue · ${c.overdue}` },
    { id: "today", label: ar ? `اليوم · ${c.today}` : `Today · ${c.today}` },
    { id: "awaiting", label: ar ? `بانتظار الاعتماد · ${c.awaiting}` : `Awaiting · ${c.awaiting}` },
    { id: "done", label: ar ? `مكتملة · ${c.done}` : `Done · ${c.done}` },
  ] : [];

  const toggleMember = (id) => {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id) ? f.memberIds.filter((x) => x !== id) : [...f.memberIds, id],
    }));
  };

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
  const progressPct = (task) => {
    const target = Math.max(1, Number(task.targetCount) || 1);
    return Math.min(100, Math.round(((Number(task.completedCount) || 0) / target) * 100));
  };
  const statusChip = (status) => {
    if (status === "completed") return "bg-[#ECFDF3] text-[#15803D] border-[#BBF7D0]";
    if (status === "awaiting_approval" || status === "pending_review") return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
    return "bg-[#F7F8FA] text-[#475467] border-[#E2E8F0]";
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
          {isAwaitingApproval(task) && isManager && (
            <>
              <button type="button" disabled={busy} onClick={() => approve(task)} className="rounded-lg bg-[#1E9E63] px-2.5 py-1 text-[11px] font-semibold text-white">
                {ar ? "اعتمد" : "Approve"}
              </button>
              <button type="button" disabled={busy} onClick={() => { setRejectFor(task); setRejectReason(""); }} className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1 text-[11px] text-[#B91C1C]">
                {ar ? "أرجع" : "Return"}
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
    <div dir={dir} className="mx-auto max-w-[1320px] space-y-4 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="font-heading text-[22px] font-semibold text-[#14284B]">
          {ar ? "المهام والعمليات" : "Operations"}
        </h1>
        <p className="text-[13px] text-[#5A6B85]">
          {c
            ? (ar
              ? `${c.active} نشطة · ${c.overdue + c.awaiting} تحتاج متابعة · نقاط معتمدة ${c.pointsAwarded}`
              : `${c.active} active · ${c.overdue + c.awaiting} need follow-up · awarded points ${c.pointsAwarded}`)
            : (ar ? "تُحمَّل العدّادات من الخادم…" : "Loading counters from server…")}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="me-1 flex gap-0.5 rounded-[10px] bg-[#EEF2F6] p-0.5">
          {[
            { id: "list", ar: "قائمة", en: "List" },
            { id: "plan", ar: "خطة", en: "Plan" },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setViewMode(v.id)}
              className={`rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium ${
                viewMode === v.id ? "bg-white text-[#14284B] shadow-sm" : "text-[#5A6B85]"
              }`}
            >
              {ar ? v.ar : v.en}
            </button>
          ))}
        </div>
        <select className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">{ar ? "كل المحطات" : "All stations"}</option>
          {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
            className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium ${
              filter === chip.id ? "border-[#1E9E63] bg-[#EAF6EF] text-[#14683F]" : "border-[#E2E8F0] bg-white text-[#5A6B85]"
            }`}
          >
            {chip.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="h-9 rounded-lg bg-[#1E9E63] px-4 text-[12.5px] font-semibold text-white hover:bg-[#178553]"
        >
          {showCreate ? (ar ? "إخفاء النموذج" : "Hide form") : (ar ? "مهمة جديدة" : "New task")}
        </button>
      </div>

      <div className={`rounded-[12px] border px-4 py-3 text-[13px] ${checkedIn ? "border-[#BBF7D0] bg-[#ECFDF3] text-[#15803D]" : "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]"}`}>
        {checkedIn
          ? (ar ? "حضور اليوم مسجَّل — يمكنك تسجيل إنجاز المهام الحضورية." : "Checked in today — you can log on-site task completion.")
          : (attendanceGate?.reason || (ar
            ? "تسجيل الإنجاز الميداني موقوف حتى بصمة اليوم — سجّل حضورك من شاشة الحضور، أو اطلب تحويل المهمة إلى عن بُعد."
            : "On-site logging is blocked until today's check-in — use Attendance, or ask to switch the task to remote."))}
        {!checkedIn && (
          <a href="/app/attendance" className="ms-2 underline font-medium">
            {ar ? "الحضور" : "Attendance"}
          </a>
        )}
      </div>

      {showCreate && (
        <form onSubmit={createTask} className="grid gap-3 rounded-[14px] border border-[#E2E8F0] bg-white p-4 md:grid-cols-2">
          <div className="md:col-span-2 text-sm font-semibold text-[#14284B]">{ar ? "مهمة جديدة" : "New task"}</div>
          <input required className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm md:col-span-2" placeholder={ar ? "عنوان المهمة" : "Task title"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm" value={form.stationId} onChange={(e) => setForm({ ...form, stationId: e.target.value })}>
            <option value="">{ar ? "المحطة" : "Station"}</option>
            {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex gap-2">
            {["one", "some", "all"].map((m) => (
              <button key={m} type="button" onClick={() => setForm({ ...form, assignMode: m })} className={`flex-1 h-10 rounded-lg border text-xs ${form.assignMode === m ? "border-[#1E9E63] bg-[#EAF6EF] text-[#14683F] font-semibold" : "border-[#E2E8F0]"}`}>
                {m === "one" ? (ar ? "فرد" : "One") : m === "some" ? (ar ? "عدة" : "Some") : (ar ? "الكل" : "All")}
              </button>
            ))}
          </div>
          {form.assignMode === "one" && (
            <select required className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm md:col-span-2" value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
              <option value="">{ar ? "المسؤول" : "Owner"}</option>
              {employees.map((emp) => {
                const id = emp.employeeId || emp.id;
                const personGate = checkAssignGate({
                  workKind: form.workKind,
                  assignMode: "one",
                  ownerId: id,
                  people: gatePeople,
                  lang: ar ? "ar" : "en",
                });
                const bad = Array.isArray(personGate.blocked) && personGate.blocked.length > 0;
                return (
                  <option key={id} value={id}>
                    {bad
                      ? (ar ? `${emp.name} — شهادة ${reqCertLabel} منتهية` : `${emp.name} — ${reqCertLabel} expired`)
                      : emp.name}
                  </option>
                );
              })}
            </select>
          )}
          {form.assignMode === "some" && (
            <div className="md:col-span-2 flex flex-wrap gap-2">
              {employees.map((emp) => {
                const id = emp.employeeId || emp.id;
                const on = form.memberIds.includes(id);
                const personGate = checkAssignGate({
                  workKind: form.workKind,
                  assignMode: "one",
                  ownerId: id,
                  people: gatePeople,
                  lang: ar ? "ar" : "en",
                });
                const bad = Array.isArray(personGate.blocked) && personGate.blocked.length > 0;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleMember(id)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      bad
                        ? (on ? "border-[#FECACA] bg-[#FEF2F2] font-semibold text-[#B91C1C]" : "border-dashed border-[#FECACA] text-[#B91C1C]")
                        : (on ? "border-[#1E9E63] bg-[#EAF6EF]" : "border-[#E2E8F0]")
                    }`}
                  >
                    {bad ? (ar ? `${emp.name} — منتهية` : `${emp.name} — expired`) : emp.name}
                  </button>
                );
              })}
            </div>
          )}
          <select className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm" value={form.workKind} onChange={(e) => setForm({ ...form, workKind: e.target.value })}>
            <option value="pm">{ar ? "وقائية (LOTO)" : "Preventive (LOTO)"}</option>
            <option value="cm">{ar ? "تصحيحية (LOTO)" : "Corrective (LOTO)"}</option>
            <option value="em">{ar ? "طارئة (إسعاف)" : "Emergency (first aid)"}</option>
            <option value="pr">{ar ? "مشروع (ارتفاع)" : "Project (height)"}</option>
            <option value="cp">{ar ? "امتثال" : "Compliance"}</option>
          </select>
          <select className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="high">{ar ? "عالية ×3" : "High ×3"}</option>
            <option value="medium">{ar ? "متوسطة ×2" : "Medium ×2"}</option>
            <option value="low">{ar ? "منخفضة ×1" : "Low ×1"}</option>
          </select>
          <input type="number" min={1} max={5} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm" value={form.effortWeight} onChange={(e) => setForm({ ...form, effortWeight: Number(e.target.value) })} />
          <input type="date" className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
          <textarea
            className="min-h-[72px] rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm md:col-span-2"
            placeholder={ar ? "خطوات التنفيذ (سطر لكل خطوة)" : "Execution steps (one per line)"}
            value={form.steps}
            onChange={(e) => setForm({ ...form, steps: e.target.value })}
          />
          <div className="md:col-span-2 space-y-1.5 text-xs text-[#5A6B85]">
            <div>
              {ar
                ? `النقاط عند الاعتماد فقط: ${taskPoints(form.priority, form.effortWeight)} · الأفق المشتق: ${HORIZON_LABEL[derivedHorizon]?.ar || derivedHorizon} · محورا التصنيف: أفق زمني + نوع عمل`
                : `Points on approval only: ${taskPoints(form.priority, form.effortWeight)} · derived horizon: ${HORIZON_LABEL[derivedHorizon]?.en || derivedHorizon} · two axes: plan horizon + work kind`}
            </div>
            <div>
              {reqCert
                ? (ar
                  ? `هذا النوع يشترط شهادة ${reqCertLabel} سارية — من انتهت شهادته لا يُقبل في أي نمط إسناد.`
                  : `This work type requires a current ${reqCertLabel} certification — anyone whose certification has lapsed cannot be assigned in any mode.`)
                : (ar ? "هذا النوع من العمل لا يشترط شهادة كفاءة." : "This work type requires no competency certification.")}
            </div>
            {certBlocked && (
              <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[11px] leading-relaxed text-[#B91C1C]">
                {clientGate.reason}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={busy || certBlocked}
            className="h-10 rounded-lg bg-[#1E9E63] px-4 text-sm font-semibold text-white md:col-span-2 disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#5A6B85]"
          >
            {ar ? "أنشئ المهمة" : "Create task"}
          </button>
          {certBlocked && (
            <p className="md:col-span-2 text-[11px] text-[#B91C1C]">
              {ar ? "الإنشاء موقوف بسبب بوابة الشهادة أعلاه (يُعاد التحقق على الخادم)." : "Create is blocked by the certificate gate above (re-checked on the server)."}
            </p>
          )}
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-2.5">
        <span className="text-xs text-[#5A6B85]">{ar ? "إثبات عند التسجيل (اختياري إن وُجدت إفادة):" : "Proof file when logging (optional if attestation):"}</span>
        <input type="file" onChange={(e) => setProofFile(e.target.files?.[0] || null)} className="text-xs" />
      </div>

      {viewMode === "plan" ? (
        <div className="space-y-3">
          <p className="text-[11px] leading-relaxed text-[#5A6B85]">
            {ar
              ? "الخطة أفق زمني مشتق من الاستحقاق — المهمة تظهر في قائمتها وفي مجموعتها دون نسخ سجلين."
              : "Plan is a horizon derived from due date — each task appears in its list and group without duplicate records."}
          </p>
          {planGroups.map((g) => (
            <div key={g.id} className="overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white">
              <div className="flex flex-wrap items-center gap-3 border-b border-[#F1F5F9] px-[18px] py-3.5">
                <div className="min-w-[140px] flex-1 text-[13px] font-semibold text-[#14284B]">
                  {ar ? HORIZON_LABEL[g.id]?.ar : HORIZON_LABEL[g.id]?.en}
                </div>
                <div className="text-[11px] text-[#5A6B85]">{ar ? `${g.rows.length} مهام` : `${g.rows.length} tasks`}</div>
                <div className="font-mono text-[11px] text-[#5A6B85]" dir="ltr">{g.unitsDone}/{g.unitsTarget}</div>
                <span className="h-[5px] w-24 overflow-hidden rounded bg-[#F1F5F9]">
                  <span className="block h-full bg-[#1E9E63]" style={{ width: `${g.pct || 0}%` }} />
                </span>
                <span className="w-8 text-end font-mono text-[11px] text-[#5A6B85]" dir="ltr">{g.pct || 0}%</span>
              </div>
              {g.rows.length === 0 ? (
                <div className="px-[18px] py-4 text-xs text-[#5A6B85]">{ar ? "لا مهام في هذا الأفق ضمن التصفية." : "No tasks in this horizon for the current filter."}</div>
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
                      className="flex cursor-pointer flex-wrap items-center gap-3 border-b border-[#F1F5F9] px-[18px] py-3 last:border-b-0 hover:bg-[#F7F8FA]"
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: priColor(task.priority) }} />
                      <div className="min-w-[200px] flex-1">
                        <div className="text-[13px] font-medium text-[#14284B]">{task.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#5A6B85]">
                          <span className="font-mono" dir="ltr">{task.ref}</span>
                          <span className="rounded border border-[#E2E8F0] bg-[#F7F8FA] px-1.5 py-0.5">
                            {ar ? KIND_LABEL[task.workKind]?.ar : KIND_LABEL[task.workKind]?.en || task.workKind}
                          </span>
                          <span>{stationName(task.stationId)} · {owner}</span>
                        </div>
                      </div>
                      <span className="text-[12px] text-[#5A6B85]">{task.dueAt ? String(task.dueAt).slice(0, 10) : "—"}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusChip(task.status)}`}>
                        {ar ? STATUS_LABEL[task.status]?.ar : STATUS_LABEL[task.status]?.en || task.status}
                      </span>
                      <span className="font-mono text-[11px] text-[#5A6B85]" dir="ltr">{task.completedCount}/{task.targetCount}</span>
                      <div onClick={(e) => e.stopPropagation()}>{renderActions(task)}</div>
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white">
          {loading ? (
            <div className="p-6 text-sm text-[#5A6B85]">{ar ? "جاري التحميل…" : "Loading…"}</div>
          ) : visible.length === 0 ? (
            <div className="border border-dashed border-[#CBD5E1] p-8 text-center text-[13px] text-[#5A6B85]">
              {ar ? "لا مهام تطابق هذا التصفية في النطاق الحالي." : "No tasks match this filter in the current scope."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[880px]">
                <div className="grid grid-cols-[minmax(260px,2.4fr)_118px_138px_108px_116px_100px_minmax(120px,1fr)] gap-3 border-b border-[#E2E8F0] bg-[#F7F8FA] px-[18px] py-2.5 text-[10px] font-semibold tracking-[0.06em] text-[#5A6B85]">
                  <div>{ar ? "المهمة" : "TASK"}</div>
                  <div>{ar ? "المحطة" : "STATION"}</div>
                  <div>{ar ? "المسؤول" : "OWNER"}</div>
                  <div>{ar ? "الاستحقاق" : "DUE"}</div>
                  <div>{ar ? "الحالة" : "STATUS"}</div>
                  <div className="text-end">{ar ? "التقدم" : "PROGRESS"}</div>
                  <div>{ar ? "إجراء" : "ACTION"}</div>
                </div>
                {visible.map((task) => {
                  const owner = ownerName(task);
                  const pct = progressPct(task);
                  return (
                    <div
                      key={task.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenTaskId(task.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpenTaskId(task.id); }}
                      className="grid cursor-pointer grid-cols-[minmax(260px,2.4fr)_118px_138px_108px_116px_100px_minmax(120px,1fr)] items-center gap-3 border-b border-[#F1F5F9] px-[18px] py-3.5 last:border-b-0 hover:bg-[#F7F8FA]"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: priColor(task.priority) }} />
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-[#14284B]">{task.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[11px] text-[#5A6B85]" dir="ltr">{task.ref}</span>
                            <span className="rounded border border-[#E2E8F0] bg-[#F7F8FA] px-1.5 py-0.5 text-[10px] text-[#5A6B85]">
                              {ar ? KIND_LABEL[task.workKind]?.ar : KIND_LABEL[task.workKind]?.en || task.workKind}
                            </span>
                            <span className="rounded border border-[#E2E8F0] px-1.5 py-0.5 text-[10px] text-[#5A6B85]">
                              ×{task.effortWeight || 1}
                            </span>
                            <span className="rounded border border-[#E2E8F0] px-1.5 py-0.5 text-[10px] text-[#5A6B85]">
                              {task.mode === "remote" ? (ar ? "عن بُعد" : "Remote") : (ar ? "حضوري" : "On-site")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="truncate text-[12px] text-[#5A6B85]">{stationName(task.stationId)}</div>
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#F1F5F9] text-[9px] text-[#5A6B85]">
                          {ownerInitials(owner)}
                        </span>
                        <span className="truncate text-[12px] text-[#5A6B85]">{owner}</span>
                      </div>
                      <div className={`text-[12px] ${task.dueAt && dayDiffFromToday(task.dueAt) < 0 && task.status !== "completed" ? "font-medium text-[#DC2626]" : "text-[#5A6B85]"}`}>
                        {task.dueAt ? String(task.dueAt).slice(0, 10) : "—"}
                      </div>
                      <div>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${statusChip(task.status)}`}>
                          {ar ? STATUS_LABEL[task.status]?.ar : STATUS_LABEL[task.status]?.en || task.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-1 flex-1 overflow-hidden rounded bg-[#F1F5F9]">
                          <span className="block h-full bg-[#1E9E63]" style={{ width: `${pct}%` }} />
                        </span>
                        <span className="w-7 text-end font-mono text-[10px] text-[#5A6B85]">{pct}%</span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>{renderActions(task)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {openTask && (
        <OpsTaskDetail
          task={openTask}
          ar={ar}
          busy={busy}
          canManage={!!isManager}
          checkedIn={checkedIn}
          attendanceGate={attendanceGate}
          onClose={() => setOpenTaskId(null)}
          onLog={(opts) => logDone(openTask, opts)}
          onApprove={() => approve(openTask)}
          onReject={async (reason) => {
            setBusy(true);
            try {
              const res = await ops({ action: "reject", taskId: openTask.id, reason });
              const body = res?.data || res;
              if (body?.error) throw new Error(body.reason || body.error);
              toast({ title: ar ? "أُعيدت للمنفّذ" : "Returned to executor" });
              setCounts(body.counts || null);
              await reload();
            } catch (err) {
              toast({ title: ar ? "فشل الرفض" : "Reject failed", description: err.message, variant: "destructive" });
            } finally {
              setBusy(false);
            }
          }}
          onAddComment={(text, isIssue) => addComment(openTask, text, isIssue)}
          onAddAttachment={(file) => addAttachment(openTask, file)}
        />
      )}

      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
            <div className="text-sm font-semibold">{ar ? "سبب الإرجاع" : "Return reason"}</div>
            <textarea className="mt-2 w-full rounded-lg border border-[#E2E8F0] p-2 text-sm" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setRejectFor(null)} className="rounded-lg border px-3 py-1.5 text-xs">{ar ? "إلغاء" : "Cancel"}</button>
              <button type="button" disabled={busy || !rejectReason.trim()} onClick={reject} className="rounded-lg bg-[#14284B] px-3 py-1.5 text-xs text-white disabled:opacity-50">
                {ar ? "تأكيد" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
