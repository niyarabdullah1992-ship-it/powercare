import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import PresenceStatusPicker from "@/components/employees/PresenceStatusPicker";
import QuickCheckInCard from "@/components/attendance/QuickCheckInCard";
import EmployeeTour from "@/components/onboarding/EmployeeTour";

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";
}

/**
 * Employee Command Center — my day: check-in, open tasks, proof queue links.
 * Visual language matches Platform handoff (navy / green / #E4E7EC), not the old hero shell.
 */
export default function EmployeeDashboard({ user, company, data }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const effectiveStationId = user.stationId || data?.stations?.[0]?.id || null;
  const station = data?.stations?.find((s) => s.id === effectiveStationId) || null;
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!company?.id) {
      setLoading(false);
      return undefined;
    }
    base44.functions
      .invoke("operations", {
        action: "list",
        companyId: company.id,
        sessionToken: getCompanyToken(company.id),
        lang: ar ? "ar" : "en",
        scope: effectiveStationId || null,
      })
      .then((res) => {
        if (!active) return;
        const body = res?.data || res || {};
        const all = Array.isArray(body.tasks) ? body.tasks : [];
        const mine = all.filter((tg) => {
          const owner = tg.ownerId || tg.employee_id;
          const members = tg.memberIds || tg.assignees || [];
          if (owner === user.id || owner === user.employeeId) return true;
          if (Array.isArray(members) && (members.includes(user.id) || members.includes(user.employeeId))) return true;
          if (tg.assignMode === "all" && (tg.stationId === effectiveStationId || tg.assignment_id === effectiveStationId)) return true;
          return false;
        });
        setTasks(mine);
        setCounts(body.counts || null);
      })
      .catch(() => {
        if (!active) return;
        setTasks([]);
        setCounts(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [user.id, user.employeeId, company?.id, effectiveStationId, ar]);

  const open = tasks.filter((tg) => tg.status !== "completed");
  const awaiting = tasks.filter((tg) => tg.status === "awaiting_approval");
  const overdue = open.filter((tg) => tg.dueAt && new Date(tg.dueAt) < new Date() && tg.status !== "awaiting_approval");
  const donePct = tasks.length ? Math.round(((tasks.length - open.length) / tasks.length) * 100) : 100;
  const readiness = Math.max(20, Math.min(100, Math.round((donePct * 0.55) + ((overdue.length ? 0 : 35)) + (awaiting.length ? 10 : 20))));
  const points = user.points || counts?.pointsAwarded || 0;

  const factors = [
    { label: ar ? "مهامي" : "My tasks", pct: donePct },
    { label: ar ? "في الموعد" : "On time", pct: open.length ? Math.max(15, 100 - overdue.length * 25) : 100 },
    { label: ar ? "إثبات" : "Proof", pct: awaiting.length ? 55 : 90 },
    { label: ar ? "نقاط" : "Points", pct: Math.min(100, points ? 40 + Math.min(60, points) : 35) },
  ];

  const queue = open.slice(0, 6).map((tg) => ({
    id: tg.id,
    name: tg.title,
    type: tg.ref || tg.workKind || "task",
    date: tg.dueAt ? String(tg.dueAt).slice(0, 10) : "—",
    status: tg.status === "awaiting_approval"
      ? (ar ? "بانتظار الاعتماد" : "Awaiting approval")
      : (overdue.some((o) => o.id === tg.id) ? (ar ? "متأخرة" : "Overdue") : (ar ? "نشطة" : "Active")),
  }));

  const alerts = [
    ...(overdue.length ? [{ text: ar ? `${overdue.length} مهمة متأخرة — سجّل إثباتًا أو اطلب تمديدًا.` : `${overdue.length} overdue tasks — log proof or request an extension.`, to: "/app/tasks" }] : []),
    ...(awaiting.length ? [{ text: ar ? `${awaiting.length} إنجاز بانتظار اعتماد المشرف.` : `${awaiting.length} completions awaiting supervisor approval.`, to: "/app/tasks" }] : []),
    { text: ar ? "سجّل حضور اليوم قبل الإنجاز الميداني." : "Check in today before logging on-site work.", to: "/app/attendance" },
  ].slice(0, 4);

  return (
    <div className="space-y-4">
      <EmployeeTour user={user} company={company} />
      <QuickCheckInCard currentUser={user} company={company} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-[11px] font-semibold tracking-[0.12em] text-[#0E7A4B]">
            {ar ? "يومي" : "MY DAY"}
          </p>
          <h1 className="m-0 mt-1 font-heading text-2xl font-semibold text-[#14284B]">
            {ar ? "مركز يومي" : "Day center"}
          </h1>
          <p className="m-0 mt-1 text-[13px] text-[#667085]">
            {station ? (ar ? `${station.name} · حضورك ومهامك في سلسلة الإثبات` : `${station.name} · your attendance and tasks in the proof cycle`) : (ar ? "حضورك ومهامك في سلسلة الإثبات" : "Your attendance and tasks in the proof cycle")}
          </p>
        </div>
        <PresenceStatusPicker user={user} />
      </div>

      <section className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.45fr)]">
        <article className="flex flex-col gap-4 rounded-[12px] bg-[#14284B] px-5 py-5 text-white">
          <p className="m-0 text-[11px] font-semibold tracking-[0.14em] text-[#8C9AB8]">
            {ar ? "جاهزية يومي" : "MY DAY READINESS"}
          </p>
          <div className="flex items-end gap-3">
            <p className="m-0 font-heading text-[52px] font-semibold leading-none tracking-tight">{readiness}</p>
            <p className="mb-2 m-0 text-sm text-[#B9C3D8]">/100</p>
          </div>
          <div className="grid gap-2.5">
            {factors.map((f) => (
              <div key={f.label} className="grid grid-cols-[72px_1fr_36px] items-center gap-2">
                <span className="text-[11.5px] text-[#B9C3D8]">{f.label}</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#0E7A4B]" style={{ width: `${f.pct}%` }} />
                </div>
                <span className="text-end font-heading text-[11px] text-white">{f.pct}%</span>
              </div>
            ))}
          </div>
          <p className="m-0 text-[12px] text-[#8C9AB8]">
            {ar ? `${open.length} مفتوحة · ${points} نقطة معتمدة` : `${open.length} open · ${points} awarded points`}
          </p>
        </article>

        <section className="overflow-hidden rounded-[12px] border border-[#E4E7EC] bg-white">
          <div className="flex items-center justify-between border-b border-[#EEF0F4] px-4 py-3.5">
            <div>
              <h2 className="m-0 text-sm font-semibold text-[#101828]">{ar ? "مهامي النشطة" : "My active tasks"}</h2>
              <p className="m-0 mt-0.5 text-[12px] text-[#667085]">
                {ar ? "كل إنجاز يحتاج إثباتًا قبل النقاط" : "Every completion needs proof before points"}
              </p>
            </div>
            <Link to="/app/tasks" className="text-[12.5px] font-medium text-[#0E7A4B] hover:text-[#0B5F3A]">
              {ar ? "العمليات" : "Operations"}
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3 p-4 animate-pulse">
              {[0, 1, 2].map((i) => <div key={i} className="h-10 rounded-lg bg-[#F2F4F7]" />)}
            </div>
          ) : queue.length === 0 ? (
            <p className="m-0 px-4 py-10 text-center text-sm text-[#98A2B3]">
              {ar ? "لا مهام مفتوحة — سلسلة إثباتك نظيفة اليوم." : "No open tasks — your proof chain is clear today."}
            </p>
          ) : (
            queue.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[1.4fr_0.9fr_0.85fr] items-center gap-2 border-b border-[#F2F4F7] px-4 py-[11px] text-[13px] last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF2F8] text-[11px] font-medium text-[#0B1A3F]">
                    {initials(r.name)}
                  </span>
                  <span className="truncate font-medium text-[#344054]">{r.name}</span>
                </div>
                <span className="truncate font-mono text-[11px] text-[#667085]" dir="ltr">{r.type}</span>
                <span className="justify-self-start rounded-md bg-[#FFF6E5] px-2.5 py-1 text-[11.5px] font-medium text-[#B54708]">
                  {r.status}
                </span>
              </div>
            ))
          )}
        </section>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: ar ? "مهام مفتوحة" : "Open tasks", value: String(open.length), to: "/app/tasks", delta: ar ? "للتنفيذ" : "To execute" },
          { label: ar ? "بانتظار الاعتماد" : "Awaiting approval", value: String(awaiting.length), to: "/app/tasks", delta: ar ? "بعد الإثبات" : "After proof" },
          { label: ar ? "متأخرة" : "Overdue", value: String(overdue.length), to: "/app/tasks", delta: ar ? "تحتاج متابعة" : "Need follow-up" },
          { label: ar ? "نقاطي" : "My points", value: String(points), to: "/app/performance", delta: ar ? "تُمنح عند الاعتماد فقط" : "Awarded on approval only" },
        ].map((k) => (
          <Link
            key={k.label}
            to={k.to}
            className="flex flex-col gap-1.5 rounded-[10px] border border-[#E4E7EC] bg-white px-[18px] py-4 transition-colors hover:border-[#0E7A4B]/40"
          >
            <p className="m-0 text-[12.5px] text-[#667085]">{k.label}</p>
            <p className="m-0 font-heading text-[28px] font-semibold leading-none text-[#101828]">{k.value}</p>
            <p className="m-0 text-xs text-[#0E7A4B]">{k.delta}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-[10px] border border-[#E4E7EC] bg-white p-4">
        <h2 className="m-0 text-sm font-semibold text-[#101828]">{ar ? "تنبيهات يومي" : "Today's alerts"}</h2>
        <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
          {alerts.map((line, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-[7px] h-[7px] w-[7px] shrink-0 rounded-full bg-[#B54708]" />
              <Link to={line.to} className="text-[12.8px] leading-[1.7] text-[#475467] hover:text-[#0E7A4B]">
                {line.text}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
