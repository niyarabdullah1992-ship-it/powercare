import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Gauge, ListTodo } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import PresenceStatusPicker from "@/components/employees/PresenceStatusPicker";
import QuickCheckInCard from "@/components/attendance/QuickCheckInCard";
import EmployeeTour from "@/components/onboarding/EmployeeTour";
import IdentityCard, { identityIconWrap } from "@/components/shared/IdentityCard";
import { ACCENT, BORDER, MUTED, NAVY, SURFACE, WARN, OK, BAD, bar, num, ui } from "@/lib/platformStyles";

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

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
    status: tg.status === "awaiting_approval"
      ? (ar ? "بانتظار الاعتماد" : "Awaiting approval")
      : (overdue.some((o) => o.id === tg.id) ? (ar ? "متأخرة" : "Overdue") : (ar ? "نشطة" : "Active")),
    tone: tg.status === "awaiting_approval" ? WARN : (overdue.some((o) => o.id === tg.id) ? BAD : OK),
  }));

  const alerts = [
    ...(overdue.length ? [{ text: ar ? `${overdue.length} مهمة متأخرة — سجّل إثباتًا أو اطلب تمديدًا.` : `${overdue.length} overdue tasks — log proof or request an extension.`, to: "/app/tasks" }] : []),
    ...(awaiting.length ? [{ text: ar ? `${awaiting.length} إنجاز بانتظار اعتماد المشرف.` : `${awaiting.length} completions awaiting supervisor approval.`, to: "/app/tasks" }] : []),
    { text: ar ? "سجّل حضور اليوم قبل الإنجاز الميداني." : "Check in today before logging on-site work.", to: "/app/attendance" },
  ].slice(0, 4);

  const kpis = [
    { label: ar ? "مهام مفتوحة" : "Open tasks", value: String(open.length), to: "/app/tasks", delta: ar ? "للتنفيذ" : "To execute" },
    { label: ar ? "بانتظار الاعتماد" : "Awaiting approval", value: String(awaiting.length), to: "/app/tasks", delta: ar ? "بعد الإثبات" : "After proof" },
    { label: ar ? "متأخرة" : "Overdue", value: String(overdue.length), to: "/app/tasks", delta: ar ? "تحتاج متابعة" : "Need follow-up" },
    { label: ar ? "نقاطي" : "My points", value: String(points), to: "/app/performance", delta: ar ? "تُمنح عند الاعتماد فقط" : "Awarded on approval only" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <EmployeeTour user={user} company={company} />
      <QuickCheckInCard currentUser={user} company={company} />

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 12, color: MUTED }}>
          {station
            ? (ar ? `${station.name} · حضورك ومهامك في سلسلة الإثبات` : `${station.name} · your attendance and tasks in the proof cycle`)
            : (ar ? "حضورك ومهامك في سلسلة الإثبات" : "Your attendance and tasks in the proof cycle")}
        </p>
        <PresenceStatusPicker user={user} />
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <IdentityCard
          icon={Gauge}
          kicker={ar ? "يومي" : "My day"}
          title={ar ? "جاهزية اليوم" : "Day readiness"}
          meta={<span style={num()}>{readiness}<span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>/100</span></span>}
          dir={ar ? "rtl" : "ltr"}
          bodySurface
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {factors.map((f) => (
              <div key={f.label} style={{ display: "grid", gridTemplateColumns: "72px 1fr 36px", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: MUTED }}>{f.label}</span>
                <div style={{ height: 6, overflow: "hidden", borderRadius: 4, background: SURFACE }}>
                  <span style={bar(f.pct, ACCENT)} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: NAVY, textAlign: "end" }}>{f.pct}%</span>
              </div>
            ))}
            <p style={{ margin: 0, fontSize: 12, color: MUTED }}>
              {ar ? `${open.length} مفتوحة · ${points} نقطة معتمدة` : `${open.length} open · ${points} awarded points`}
            </p>
          </div>
        </IdentityCard>

        <IdentityCard
          icon={ListTodo}
          kicker={ar ? "مهام" : "Tasks"}
          title={ar ? "مهامي النشطة" : "My active tasks"}
          subtitle={ar ? "كل إنجاز يحتاج إثباتًا قبل النقاط." : "Every completion needs proof before points."}
          meta={(
            <Link to="/app/tasks" style={{ ...ui.btnSecondary, textDecoration: "none" }}>
              {ar ? "العمليات" : "Operations"}
            </Link>
          )}
          dir={ar ? "rtl" : "ltr"}
          bodySurface
        >
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[0, 1, 2].map((i) => <div key={i} style={{ height: 36, borderRadius: 9, background: SURFACE }} />)}
            </div>
          ) : queue.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: MUTED, textAlign: "center", padding: "18px 0" }}>
              {ar ? "لا مهام مفتوحة — سلسلة إثباتك نظيفة اليوم." : "No open tasks — your proof chain is clear today."}
            </p>
          ) : (
            queue.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ ...identityIconWrap, width: 32, height: 32, borderRadius: "50%", fontSize: 11, fontWeight: 600 }}>
                  {initials(r.name)}
                </span>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: 600, color: NAVY }}>{r.name}</span>
                <span style={r.tone}>{r.status}</span>
              </div>
            ))
          )}
        </IdentityCard>
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {kpis.map((k) => (
          <Link key={k.label} to={k.to} style={{ textDecoration: "none" }}>
            <IdentityCard title={k.label} subtitle={k.delta} meta={<span style={num()}>{k.value}</span>} dir={ar ? "rtl" : "ltr"} />
          </Link>
        ))}
      </div>

      <IdentityCard
        kicker={ar ? "تنبيه" : "Alert"}
        title={ar ? "تنبيهات اليوم" : "Today's alerts"}
        dir={ar ? "rtl" : "ltr"}
        bodySurface
      >
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.map((line, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ width: 7, height: 7, marginTop: 6, borderRadius: "50%", background: "#B45309", flexShrink: 0 }} />
              <Link to={line.to} style={{ fontSize: 13, color: NAVY, textDecoration: "none", lineHeight: 1.55 }}>{line.text}</Link>
            </li>
          ))}
        </ul>
      </IdentityCard>
    </div>
  );
}
