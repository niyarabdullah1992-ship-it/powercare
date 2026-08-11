import React, { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { taskPoints } from "@/lib/opsDerivations";
import { toast } from "@/components/ui/use-toast";

/**
 * Operations console — all counters and gates come from
 * base44.functions.invoke("operations", …). No hardcoded KPI literals.
 */
export default function Operations() {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const { currentUser, company, data, refresh } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [scope, setScope] = useState("all");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    stationId: "",
    ownerId: "",
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
    } catch (e) {
      toast({ title: ar ? "تعذّر تحميل المهام" : "Failed to load tasks", description: e?.message || "", variant: "destructive" });
      setTasks([]);
      setCounts(null);
    } finally {
      setLoading(false);
    }
  }, [ops, company?.id, ar]);

  useEffect(() => { reload(); }, [reload]);

  const stations = data?.stations || [];
  const employees = (data?.employees || []).filter((e) => !form.stationId || e.stationId === form.stationId);

  const createTask = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await ops({
        action: "create",
        title: form.title,
        stationId: form.stationId || null,
        ownerId: form.ownerId,
        assignMode: "one",
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
      setForm((f) => ({ ...f, title: "" }));
      setCounts(body.counts || null);
      await reload();
    } catch (err) {
      const dataErr = err?.response?.data || err?.data || {};
      const reason = dataErr.reason || dataErr.error || err?.message || "";
      toast({
        title: dataErr.error === "ASSIGN_GATE" ? (ar ? "بوابة الإسناد" : "Assignment gate") : (ar ? "رُفض الإنشاء" : "Create blocked"),
        description: reason,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const logDone = async (task) => {
    setBusy(true);
    try {
      const res = await ops({
        action: "logCompletion",
        taskId: task.id,
        amount: 1,
        attestation: ar
          ? `إفادة إنجاز بواسطة ${currentUser?.name || "المستخدم"}`
          : `Completion attested by ${currentUser?.name || "user"}`,
      });
      const body = res?.data || res;
      if (body?.error) throw new Error(body.reason || body.error);
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
      toast({
        title: ar ? "اعتُمد الإنجاز" : "Approved",
        description: ar
          ? `مُنحت ${body?.awarded?.points ?? taskPoints(task.priority, task.effortWeight)} نقطة`
          : `Granted ${body?.awarded?.points ?? taskPoints(task.priority, task.effortWeight)} points`,
      });
      setCounts(body.counts || null);
      await refresh?.();
      await reload();
    } catch (err) {
      toast({ title: ar ? "فشل الاعتماد" : "Approve failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const visible = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "overdue") return counts && true; // server list already scoped; filter client by due
    if (filter === "today") return t.dueAt && t.dueAt.slice(0, 10) === new Date().toISOString().slice(0, 10);
    if (filter === "awaiting") return t.status === "awaiting_approval";
    if (filter === "done") return t.status === "completed";
    return true;
  }).filter((t) => {
    if (filter === "overdue") {
      if (!t.dueAt || t.status === "completed") return false;
      return new Date(`${t.dueAt}T00:00:00`) < new Date(new Date().toDateString());
    }
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
        <select
          className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <option value="all">{ar ? "كل المحطات" : "All stations"}</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
            className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium ${
              filter === chip.id
                ? "border-[#1E9E63] bg-[#EAF6EF] text-[#14683F]"
                : "border-[#E2E8F0] bg-white text-[#5A6B85]"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <form onSubmit={createTask} className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 md:grid-cols-2">
        <div className="md:col-span-2 text-sm font-semibold text-[#14284B]">{ar ? "مهمة جديدة" : "New task"}</div>
        <input
          required
          className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm md:col-span-2"
          placeholder={ar ? "عنوان المهمة" : "Task title"}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <select className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm" value={form.stationId} onChange={(e) => setForm({ ...form, stationId: e.target.value })}>
          <option value="">{ar ? "المحطة" : "Station"}</option>
          {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select required className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm" value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
          <option value="">{ar ? "المسؤول" : "Owner"}</option>
          {employees.map((emp) => {
            const id = emp.employeeId || emp.id;
            return <option key={id} value={id}>{emp.name}</option>;
          })}
        </select>
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
            ? `النقاط عند الاعتماد فقط: ${taskPoints(form.priority, form.effortWeight)} (أولوية × وزن)`
            : `Points on approval only: ${taskPoints(form.priority, form.effortWeight)} (priority × weight)`}
        </div>
        <button type="submit" disabled={busy} className="h-10 rounded-lg bg-[#1E9E63] px-4 text-sm font-semibold text-white md:col-span-2 disabled:opacity-50">
          {ar ? "أنشئ المهمة" : "Create task"}
        </button>
      </form>

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
                    {task.ref} · {task.completedCount}/{task.targetCount} · {task.status}
                    {task.pointsAwarded != null ? ` · +${task.pointsAwarded} pts` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  {task.status !== "completed" && task.status !== "awaiting_approval" && (
                    <button type="button" disabled={busy} onClick={() => logDone(task)} className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs">
                      {ar ? "سجّل إنجازًا" : "Log completion"}
                    </button>
                  )}
                  {task.status === "awaiting_approval" && (
                    <button type="button" disabled={busy} onClick={() => approve(task)} className="rounded-lg bg-[#1E9E63] px-3 py-1.5 text-xs font-semibold text-white">
                      {ar ? "اعتمد" : "Approve"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
