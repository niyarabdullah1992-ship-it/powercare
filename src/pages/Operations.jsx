import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { getCompanyToken, syncPointsFromCloud } from "@/lib/store";
import { dayDiffFromToday, planHorizonFromDue, taskPoints } from "@/lib/opsDerivations";
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
  const [busy, setBusy] = useState(false);
  const [rejectFor, setRejectFor] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [proofFile, setProofFile] = useState(null);
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
      const res = await ops({ action: "list" });
      const body = res?.data || res;
      setTasks(Array.isArray(body?.tasks) ? body.tasks : []);
      setCounts(body?.counts || null);
      setHorizons(Array.isArray(body?.horizons) ? body.horizons : []);
    } catch (e) {
      toast({ title: ar ? "تعذّر تحميل المهام" : "Failed to load tasks", description: e?.message || "", variant: "destructive" });
      setTasks([]);
      setCounts(null);
      setHorizons([]);
    } finally {
      setLoading(false);
    }
  }, [ops, company?.id, ar]);

  useEffect(() => { reload(); }, [reload]);

  const stations = data?.stations || [];
  const employees = useMemo(() => {
    const all = data?.employees || [];
    if (!form.stationId) return all;
    return all.filter((e) => e.stationId === form.stationId);
  }, [data?.employees, form.stationId]);

  const derivedHorizon = planHorizonFromDue(form.dueAt || null);

  const createTask = async (e) => {
    e.preventDefault();
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
      setForm((f) => ({ ...f, title: "", memberIds: [] }));
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

  const logDone = async (task) => {
    setBusy(true);
    try {
      let proofFiles = [];
      if (proofFile) {
        const up = await base44.integrations.Core.UploadFile({ file: proofFile });
        proofFiles = [{ url: up.file_url, name: proofFile.name }];
      }
      const res = await ops({
        action: "logCompletion",
        taskId: task.id,
        amount: 1,
        proofFiles,
        attestation: proofFiles.length
          ? ""
          : (ar ? `إفادة إنجاز بواسطة ${currentUser?.name || "المستخدم"}` : `Completion attested by ${currentUser?.name || "user"}`),
      });
      const body = res?.data || res;
      if (body?.error) throw new Error(body.reason || body.error);
      setProofFile(null);
      setCounts(body.counts || null);
      await reload();
    } catch (err) {
      toast({ title: ar ? "فشل التسجيل" : "Log failed", description: err.message, variant: "destructive" });
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
    if (filter === "overdue") return t.dueAt && dayDiffFromToday(t.dueAt) < 0 && t.status !== "completed";
    if (filter === "today") return t.dueAt && t.dueAt.slice(0, 10) === todayKey;
    if (filter === "awaiting") return t.status === "awaiting_approval";
    if (filter === "done") return t.status === "completed";
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

  return (
    <div dir={dir} className="mx-auto max-w-[1320px] space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-[#14284B]">
          {ar ? "المهام والعمليات" : "Operations"}
        </h1>
        <p className="text-sm text-[#5A6B85]">
          {c
            ? (ar
              ? `${c.active} نشطة · ${c.overdue + c.awaiting} تحتاج متابعة · نقاط معتمدة ${c.pointsAwarded}`
              : `${c.active} active · ${c.overdue + c.awaiting} need follow-up · awarded points ${c.pointsAwarded}`)
            : (ar ? "تُحمَّل العدّادات من الخادم…" : "Loading counters from server…")}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
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
      </div>

      {horizons.some((h) => h.count > 0) && (
        <div className="grid gap-2 sm:grid-cols-5">
          {horizons.map((h) => (
            <div key={h.id} className="rounded-lg border border-[#E2E8F0] bg-white p-3">
              <div className="text-[11px] text-[#5A6B85]">{ar ? HORIZON_LABEL[h.id]?.ar : HORIZON_LABEL[h.id]?.en}</div>
              <div className="mt-1 font-semibold text-[#14284B]" dir="ltr">{h.pct}% · {h.unitsDone}/{h.unitsTarget}</div>
              <div className="text-[10px] text-[#5A6B85]">{ar ? `${h.count} مهام` : `${h.count} tasks`}</div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={createTask} className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 md:grid-cols-2">
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
              return <option key={id} value={id}>{emp.name}</option>;
            })}
          </select>
        )}
        {form.assignMode === "some" && (
          <div className="md:col-span-2 flex flex-wrap gap-2">
            {employees.map((emp) => {
              const id = emp.employeeId || emp.id;
              const on = form.memberIds.includes(id);
              return (
                <button key={id} type="button" onClick={() => toggleMember(id)} className={`rounded-full border px-3 py-1 text-xs ${on ? "border-[#1E9E63] bg-[#EAF6EF]" : "border-[#E2E8F0]"}`}>
                  {emp.name}
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
        <div className="md:col-span-2 text-xs text-[#5A6B85]">
          {ar
            ? `النقاط عند الاعتماد فقط: ${taskPoints(form.priority, form.effortWeight)} · الأفق المشتق: ${HORIZON_LABEL[derivedHorizon]?.ar || derivedHorizon}`
            : `Points on approval only: ${taskPoints(form.priority, form.effortWeight)} · derived horizon: ${HORIZON_LABEL[derivedHorizon]?.en || derivedHorizon}`}
        </div>
        <button type="submit" disabled={busy} className="h-10 rounded-lg bg-[#1E9E63] px-4 text-sm font-semibold text-white md:col-span-2 disabled:opacity-50">
          {ar ? "أنشئ المهمة" : "Create task"}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3">
        <span className="text-xs text-[#5A6B85]">{ar ? "إثبات عند التسجيل (اختياري إن وُجدت إفادة):" : "Proof file when logging (optional if attestation):"}</span>
        <input type="file" onChange={(e) => setProofFile(e.target.files?.[0] || null)} className="text-xs" />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
        {loading ? (
          <div className="p-6 text-sm text-[#5A6B85]">{ar ? "جاري التحميل…" : "Loading…"}</div>
        ) : visible.length === 0 ? (
          <div className="p-6 text-sm text-[#5A6B85]">{ar ? "لا مهام تطابق هذا التصفية في النطاق الحالي." : "No tasks match this filter in the current scope."}</div>
        ) : (
          <ul className="divide-y divide-[#E2E8F0]">
            {visible.map((task) => (
              <li key={task.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium text-[#14284B]">{task.title}</div>
                  <div className="mt-1 font-mono text-xs text-[#5A6B85]" dir="ltr">
                    {task.ref} · {task.completedCount}/{task.targetCount} · {task.status} · {task.planHorizon || "w"}
                    {task.pointsAwarded != null ? ` · +${task.pointsAwarded} pts` : ""}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {task.status !== "completed" && task.status !== "awaiting_approval" && (
                    <button type="button" disabled={busy} onClick={() => logDone(task)} className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs">
                      {ar ? "سجّل إنجازًا" : "Log completion"}
                    </button>
                  )}
                  {task.status === "awaiting_approval" && (
                    <>
                      <button type="button" disabled={busy} onClick={() => approve(task)} className="rounded-lg bg-[#1E9E63] px-3 py-1.5 text-xs font-semibold text-white">
                        {ar ? "اعتمد" : "Approve"}
                      </button>
                      <button type="button" disabled={busy} onClick={() => { setRejectFor(task); setRejectReason(""); }} className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-1.5 text-xs text-[#B91C1C]">
                        {ar ? "أرجع" : "Return"}
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

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
