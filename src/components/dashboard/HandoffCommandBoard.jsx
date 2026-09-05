import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, ChevronLeft, Gauge, Mail, Users } from "lucide-react";
import {
  ACCENT, BORDER, INK, NAVY, MUTED, BAD, WARN, NEUTRAL, bar, dot, num, pill, ui, CARD, SURFACE, statCard,
} from "@/lib/platformStyles";
import { ChromeBox } from "@/components/shared/IdentityCard";
import { setStationScope } from "@/lib/stationScopeStore";
import useStationScope from "@/hooks/useStationScope";

/**
 * Command Center — greeting, four KPIs, tinted alerts, decision queue.
 */

function sparkBars(vals, color) {
  return vals.map((v, i) => ({
    key: i,
    style: {
      display: "block",
      width: "5px",
      height: `${Math.max(3, v)}px`,
      borderRadius: "2px",
      background: color,
      opacity: 0.5,
    },
  }));
}

function levelTone(open) {
  if (open >= 8) return { dot: "#DC2626", open: "#DC2626", spark: "#DC2626" };
  if (open >= 4) return { dot: "#F59E0B", open: "#B45309", spark: "#F59E0B" };
  return { dot: ACCENT, open: NAVY, spark: ACCENT };
}

function inferAlertLevel(to) {
  if (!to) return "warn";
  if (String(to).includes("safety")) return "critical";
  if (String(to).includes("leave")) return "ok";
  if (String(to).includes("task") || String(to).includes("escalation")) return "info";
  return "warn";
}

function alertSkin(level) {
  if (level === "critical" || level === "bad") return { bg: "#FEF2F2", fg: "#B91C1C", bd: "#FECACA" };
  if (level === "ok") return { bg: "#ECFDF3", fg: "#15803D", bd: "#BBF7D0" };
  if (level === "info") return { bg: "#EFF6FF", fg: "#1D4ED8", bd: "#BFDBFE" };
  return { bg: "#FFFBEB", fg: "#B45309", bd: "#FDE68A" };
}

function kpiGlyph(bg, fg, Icon) {
  return (
    <span
      aria-hidden
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: bg,
        color: fg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon style={{ width: 16, height: 16 }} strokeWidth={1.8} />
    </span>
  );
}

function ReadinessRing({ score, size = 36 }) {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const deg = (clamped / 100) * 360;
  const color = clamped >= 70 ? ACCENT : clamped >= 40 ? "#F59E0B" : "#DC2626";
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `conic-gradient(${color} ${deg}deg, #E2E8F0 0deg)`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: size - 10,
          height: size - 10,
          borderRadius: "50%",
          background: CARD,
        }}
      />
    </span>
  );
}

export default function HandoffCommandBoard({
  lang = "ar",
  greetName = "",
  toolbar = null,
  readinessScore = 0,
  readinessDelta = null,
  factors = [],
  employeesCount = 0,
  employeesDelta = null,
  attendanceRate = 0,
  pendingLeave = 0,
  pendingReports = 0,
  leaveQueue = [],
  alerts = [],
  stations = [],
  openHazards = 0,
  criticalHazards = 0,
  presentCount = 0,
  lateCount = 0,
  leaveCount = 0,
  absentCount = 0,
  daysClear = null,
}) {
  const ar = lang === "ar";
  const scope = useStationScope();
  const score = Math.max(0, Math.min(100, Math.round(Number(readinessScore) || 0)));
  const factorBars = (factors.length ? factors : [
    { label: ar ? "الحضور" : "Attendance", pct: attendanceRate },
    { label: ar ? "إنجاز المهام" : "Task completion", pct: 78 },
    { label: ar ? "إغلاق بنود السلامة" : "Safety closure", pct: Math.max(0, 100 - openHazards * 10) },
    { label: ar ? "جاهزية الأصول" : "Asset uptime", pct: 97 },
  ]).slice(0, 4);

  const queue = leaveQueue.slice(0, 6).map((r) => ({
    ...r,
    to: r.to || (String(r.type || "").includes("تقرير") || /report/i.test(String(r.type || ""))
      ? "/app/daily-report"
      : "/app/leave"),
    action: r.action || (ar ? "راجع" : "Review"),
    age: r.date || r.age || "—",
    title: r.title || r.name || "—",
    meta: r.meta || [r.type, r.date || r.age].filter(Boolean).join(" · "),
    status: r.status || (ar ? "بانتظار المدير" : "Awaiting manager"),
    level: r.level || "warn",
  }));

  const pendingDecisions = Number(pendingLeave || 0) + Number(pendingReports || 0);
  const alertLines = (alerts.length ? alerts : []).slice(0, 4).map((a) => {
    if (typeof a === "string") return { text: a, to: null, level: "warn" };
    return {
      text: a.title || a.message || a.text || String(a),
      to: a.to || a.href || null,
      level: a.level || inferAlertLevel(a.to),
    };
  });

  const present = presentCount || Math.round((attendanceRate / 100) * Math.max(1, employeesCount));
  const late = lateCount || 0;
  const onLeave = leaveCount || pendingLeave || 0;
  const absent = absentCount || 0;
  const bandTotal = Math.max(1, present + late + onLeave + absent);
  const shiftBands = [
    { label: ar ? "حاضر" : "Present", count: present, color: ACCENT, flex: present },
    { label: ar ? "متأخر" : "Late", count: late, color: "#F59E0B", flex: Math.max(late, 0) },
    { label: ar ? "إجازة" : "On leave", count: onLeave, color: "#94A3B8", flex: Math.max(onLeave, 0) },
    { label: ar ? "غائب" : "Absent", count: absent, color: "#DC2626", flex: Math.max(absent, 0) },
  ];

  const hseRows = [
    { count: criticalHazards, label: ar ? "مخاطر حرجة مفتوحة" : "Critical hazards open", style: BAD },
    { count: Math.max(0, openHazards - criticalHazards), label: ar ? "ملاحظات سلامة بانتظار الإغلاق" : "Observations pending closure", style: WARN },
    { count: pendingReports, label: ar ? "تقارير بانتظار الاعتماد" : "Reports awaiting approval", style: NEUTRAL },
  ];

  const decisionsCountLabel = queue.length === 0
    ? (ar ? "لا شيء معلّق" : "Nothing pending")
    : (ar ? (queue.length === 1 ? "بند واحد" : queue.length === 2 ? "بندان" : `${queue.length} بنود`) : `${queue.length} items`);

  const kpiLink = {
    ...statCard,
    textDecoration: "none",
    color: "inherit",
    display: "block",
    boxShadow: "0 8px 24px rgba(20,40,75,.05)",
  };

  const kpis = [
    {
      key: "scheduled",
      to: "/app/attendance",
      label: ar ? "المجدولون اليوم" : "Scheduled today",
      value: employeesCount,
      icon: kpiGlyph("#EFF6FF", "#1D4ED8", Users),
      hint: (
        <>
          {employeesDelta != null && employeesDelta !== 0 ? (
            <span
              dir="ltr"
              style={{
                ...pill("#ECFDF3", "#15803D", "#BBF7D0"),
                marginInlineEnd: 6,
                fontFamily: "'IBM Plex Sans',sans-serif",
              }}
            >
              {employeesDelta > 0 ? "+" : ""}
              {employeesDelta}
            </span>
          ) : null}
          <span>{ar ? "ضمن نطاق العرض الحالي" : "in the current display range"}</span>
        </>
      ),
    },
    {
      key: "attendance",
      to: "/app/attendance",
      label: ar ? "نسبة الحضور" : "Attendance rate",
      value: `${Math.round(Number(attendanceRate) || 0)}%`,
      icon: kpiGlyph("#ECFDF3", "#15803D", CalendarCheck),
      hint: ar ? `${present} حاضرون الآن` : `${present} present now`,
    },
    {
      key: "decisions",
      to: "/app/leave",
      label: ar ? "بانتظار قرارك" : "Awaiting your decision",
      value: pendingDecisions,
      icon: kpiGlyph(pendingDecisions > 0 ? "#FEF2F2" : "#F8FAFC", pendingDecisions > 0 ? "#B91C1C" : MUTED, Mail),
      hint: ar
        ? `${pendingLeave} إجازة · ${pendingReports} تقارير`
        : `${pendingLeave} leave · ${pendingReports} reports`,
      alert: pendingDecisions > 0,
    },
    {
      key: "readiness",
      to: null,
      label: ar ? "مؤشر الجاهزية" : "Readiness index",
      value: (
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
          {score}
          <span dir="ltr" style={{ fontSize: 14, fontWeight: 500, color: MUTED }}>/100</span>
        </span>
      ),
      icon: <ReadinessRing score={score} />,
      hint: (
        <>
          {readinessDelta != null ? (
            <span
              dir="ltr"
              style={{
                ...pill("#ECFDF3", "#15803D", "#BBF7D0"),
                marginInlineEnd: 6,
                fontFamily: "'IBM Plex Sans',sans-serif",
              }}
            >
              {readinessDelta > 0 ? "+" : ""}
              {readinessDelta}
            </span>
          ) : null}
          <span>{ar ? "حضور · مهام · سلامة · اعتمادات" : "attendance · tasks · safety · approvals"}</span>
        </>
      ),
      extra: kpiGlyph("#FFF7ED", "#C2410C", Gauge),
    },
  ];

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1320px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: "1 1 280px" }}>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", color: INK, lineHeight: 1.25 }}>
            {greetName
              ? (ar ? `أهلاً بعودتك، ${greetName}` : `Welcome back, ${greetName}`)
              : (ar ? "أهلاً بعودتك" : "Welcome back")}
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.65, color: MUTED, maxWidth: 560 }}>
            {ar
              ? "نظرة واضحة على الفريق والحضور والقرارات المعلقة — كل ما يهمك اليوم في شاشة واحدة."
              : "A clear view of the team, attendance, and pending decisions — everything that matters today on one screen."}
          </p>
        </div>
        {toolbar}
      </div>

      <div className="nv-command-kpis">
        {kpis.map((kpi) => {
          const body = (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: MUTED }}>{kpi.label}</span>
                {kpi.extra || kpi.icon}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {kpi.extra ? kpi.icon : null}
                <div
                  style={{
                    fontFamily: "'IBM Plex Sans',sans-serif",
                    fontSize: 32,
                    fontWeight: 650,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    color: NAVY,
                  }}
                >
                  {kpi.value}
                </div>
                {kpi.alert ? <span style={{ ...dot("#DC2626"), width: 8, height: 8 }} /> : null}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: MUTED, display: "flex", alignItems: "center", flexWrap: "wrap", minHeight: 18 }}>
                {kpi.hint}
              </div>
            </>
          );
          return kpi.to ? (
            <Link key={kpi.key} to={kpi.to} style={kpiLink}>{body}</Link>
          ) : (
            <div key={kpi.key} style={{ ...kpiLink, cursor: "default" }}>{body}</div>
          );
        })}
      </div>

      <div className="nv-handoff-top">
        <div
          style={{
            minWidth: 0,
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 8px 24px rgba(20,40,75,.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>
              {ar ? "ما يحتاج قرارك اليوم" : "Needs your decision today"}
            </div>
            <span
              style={{
                ...pill(
                  queue.length ? "#FEF2F2" : SURFACE,
                  queue.length ? "#B91C1C" : MUTED,
                  queue.length ? "#FECACA" : BORDER,
                ),
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {decisionsCountLabel}
            </span>
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>
            {ar ? "مرتبة بأثرها على التشغيل، لا بتاريخها" : "Ranked by operational impact, not by date"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {queue.length === 0 ? (
              <div style={{ padding: "26px 0", textAlign: "center", fontSize: 13, color: MUTED }}>
                {ar ? "لا بنود تحتاج قرارك اليوم" : "Nothing needs your decision today"}
              </div>
            ) : (
              queue.map((r) => (
                <div
                  key={r.id || `${r.title}-${r.age}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderTop: `1px solid ${BORDER}`,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, textWrap: "pretty" }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{r.meta}</div>
                  </div>
                  <span style={pill("#FFFBEB", "#B45309", "#FDE68A")}>{r.status}</span>
                  <Link
                    to={r.to}
                    style={{ ...ui.btnCreate, textDecoration: "none", gap: 4, height: 32 }}
                  >
                    {r.action}
                    <ChevronLeft style={{ width: 13, height: 13, transform: ar ? "none" : "scaleX(-1)" }} strokeWidth={2.2} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: "16px 18px",
              boxShadow: "0 8px 24px rgba(20,40,75,.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{ar ? "تنبيهات استباقية" : "Proactive alerts"}</div>
              <div style={{ fontSize: 11, color: MUTED }}>
                {ar ? "كل تنبيه يفتح القسم الذي يصلحه" : "Each alert opens the section that fixes it"}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {alertLines.length === 0 ? (
                <div style={{ fontSize: 12, color: MUTED, padding: "8px 0" }}>
                  {ar ? "لا تنبيهات الآن" : "No alerts right now"}
                </div>
              ) : (
                alertLines.map((line, i) => {
                  const skin = alertSkin(line.level);
                  const style = {
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 13px",
                    borderRadius: 12,
                    border: `1px solid ${skin.bd}`,
                    background: skin.bg,
                    cursor: line.to ? "pointer" : "default",
                    fontFamily: "inherit",
                    fontSize: 12,
                    color: skin.fg,
                    textAlign: "start",
                    width: "100%",
                    textDecoration: "none",
                    fontWeight: 500,
                  };
                  const body = (
                    <>
                      <span style={dot(skin.fg)} />
                      <span style={{ flex: 1, textAlign: "start", color: INK }}>{line.text}</span>
                    </>
                  );
                  return line.to ? (
                    <Link key={i} to={line.to} style={style}>{body}</Link>
                  ) : (
                    <div key={i} style={style}>{body}</div>
                  );
                })
              )}
            </div>
          </div>

          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: "16px 18px",
              boxShadow: "0 8px 24px rgba(20,40,75,.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{ar ? "مكونات الجاهزية" : "Readiness components"}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                  {ar ? "نفس عوامل المؤشر أعلاه" : "Same factors as the index above"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <ReadinessRing score={score} size={32} />
                <div style={{ textAlign: "start" }}>
                  <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 18, fontWeight: 650, lineHeight: 1, color: NAVY }}>
                    {score}
                    <span dir="ltr" style={{ fontSize: 12, fontWeight: 500, color: MUTED }}> /100</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {factorBars.map((f) => {
                const pct = Math.max(0, Math.min(100, Number(f.pct) || 0));
                const barColor = pct < 70 ? "#F59E0B" : ACCENT;
                return (
                  <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ flex: 1, fontSize: 12, color: MUTED, whiteSpace: "nowrap" }}>{f.label}</span>
                    <span
                      style={{
                        width: 74,
                        height: 4,
                        borderRadius: 4,
                        background: SURFACE,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      <span style={bar(pct, barColor)} />
                    </span>
                    <span
                      style={{
                        width: 32,
                        textAlign: "end",
                        fontSize: 11,
                        fontFamily: "'IBM Plex Sans',sans-serif",
                        color: INK,
                      }}
                    >
                      {Math.round(pct)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>{ar ? "الفروع" : "Stations"}</div>
          <div style={{ fontSize: "11px", color: MUTED }}>
            {ar ? "اضغط فرعًا لتضييق اللوحة" : "Pick a branch to narrow the board"}
          </div>
          {scope !== "all" && (
            <button
              type="button"
              onClick={() => setStationScope("all")}
              style={{ marginInlineStart: "auto", border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: "11px", fontWeight: 500, color: ACCENT }}
            >
              {ar ? "كل الفروع" : "All stations"}
            </button>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: "12px" }}>
          {(stations || []).map((s) => {
            const open = Number(s.open ?? 0);
            const crew = Number(s.crew ?? 0);
            const tone = levelTone(open);
            const spark = sparkBars([8, 11, 9, 13, 12, 14, Math.min(22, 13 + open)], tone.spark);
            return (
              <StationCard
                key={s.id || s.name}
                name={s.name}
                code={s.code || ""}
                crew={crew}
                open={open}
                tone={tone}
                spark={spark}
                ar={ar}
                active={String(scope) === String(s.id)}
                onClick={() => setStationScope(s.id ? s.id : "all")}
              />
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: "16px" }}>
        <ChromeBox>
          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>
            {ar ? "حضور اليوم" : "Today's attendance"}
          </div>
          <div style={{ fontSize: "11px", color: MUTED, marginBottom: "16px" }}>
            {ar
              ? `${employeesCount} متوقعًا اليوم · نفس رقم شاشة الحضور`
              : `${employeesCount} expected today · same figure as Attendance`}
          </div>
          <div style={{ display: "flex", height: "9px", borderRadius: "6px", overflow: "hidden", gap: "2px" }}>
            {shiftBands.map((b) => (
              <span
                key={b.label}
                style={{
                  display: "block",
                  flex: Math.max(0.5, (b.flex / bandTotal) * 100),
                  background: b.color,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginTop: "14px" }}>
            {shiftBands.map((b) => (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={dot(b.color)} />
                <span style={{ fontSize: "12px", color: MUTED }}>{b.label}</span>
                <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: "'IBM Plex Sans',sans-serif" }}>{b.count}</span>
              </div>
            ))}
          </div>
        </ChromeBox>

        <ChromeBox>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>{ar ? "السلامة" : "Safety"}</div>
              <div style={{ fontSize: "11px", color: MUTED }}>
                {ar ? "بنود مفتوحة بانتظار الإغلاق" : "Open items awaiting closure"}
              </div>
            </div>
            <div style={{ textAlign: "left", flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: "'IBM Plex Sans',sans-serif",
                  fontSize: "28px",
                  fontWeight: 600,
                  lineHeight: 1,
                  color: ACCENT,
                }}
              >
                {daysClear != null ? daysClear : "—"}
              </div>
              <div style={{ fontSize: "10px", color: MUTED, marginTop: "2px" }}>
                {ar ? "يومًا بلا حادث" : "days clear"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {hseRows.map((r) => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={r.style}>{r.count}</span>
                <span style={{ flex: 1, fontSize: "12px", fontWeight: 500, color: INK }}>{r.label}</span>
              </div>
            ))}
          </div>
        </ChromeBox>
      </div>
    </div>
  );
}

/** Selecting a station re-scopes the board in place — it never leaves the page. */
function StationCard({ name, code, crew, open, tone, spark, ar, onClick, active }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-pressed={active}
      title={ar ? "اجعل هذا الفرع نطاق الصفحة" : "Scope this page to this station"}
      style={{
        background: active ? "color-mix(in oklab, var(--nv-accent) 16%, var(--nv-card))" : CARD,
        border: `1px solid ${active || hover ? ACCENT : BORDER}`,
        borderRadius: "13px",
        padding: "14px",
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
        display: "block",
        width: "100%",
        textAlign: "start",
        fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={dot(tone.dot)} />
        <span
          style={{
            flex: 1,
            fontSize: "13px",
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: NAVY,
          }}
        >
          {name}
        </span>
        <span style={{ fontSize: "10px", color: MUTED, fontFamily: "'IBM Plex Mono',monospace" }}>{code}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", marginTop: "14px" }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "20px", fontWeight: 600, lineHeight: 1, color: NAVY }}>
            {crew}
          </div>
          <div style={{ fontSize: "10px", color: MUTED, marginTop: "3px", whiteSpace: "nowrap" }}>
            {ar ? "في الوردية" : "on shift"}
          </div>
        </div>
        <div>
          <div style={num(tone.open)}>{open}</div>
          <div style={{ fontSize: "10px", color: MUTED, marginTop: "3px", whiteSpace: "nowrap" }}>
            {ar ? "بند مفتوح" : "open"}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-start",
            gap: "2px",
            height: "26px",
            overflow: "hidden",
          }}
        >
          {spark.map((b) => (
            <span key={b.key} style={b.style} />
          ))}
        </div>
      </div>
    </button>
  );
}
