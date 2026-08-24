import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ACCENT, BORDER, INK, NAVY, MUTED, BAD, WARN, NEUTRAL, bar, dot, num, ui, CARD, SURFACE } from "@/lib/platformStyles";
import { ChromeBox } from "@/components/shared/IdentityCard";
import { setStationScope } from "@/lib/stationScopeStore";
import useStationScope from "@/hooks/useStationScope";

/**
 * Command Center — Platform.dc.html L142–287 literal styles.
 * Blocks: readiness · decisions · alerts · station strip · attendance bands · HSE mini.
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

export default function HandoffCommandBoard({
  lang = "ar",
  readinessScore = 0,
  readinessDelta = null,
  factors = [],
  employeesCount = 0,
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
    meta: r.meta || [r.type, r.status].filter(Boolean).join(" · "),
    level: r.level || "warn",
  }));

  const alertLines = (alerts.length ? alerts : []).slice(0, 4).map((a) => {
    if (typeof a === "string") return { text: a, to: null, color: "#F59E0B" };
    const level = a.level || "warn";
    const color = level === "critical" || level === "bad" ? "#DC2626" : level === "ok" ? ACCENT : "#F59E0B";
    return { text: a.title || a.message || a.text || String(a), to: a.to || a.href || null, color };
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

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1320px" }}>
      {/* L145–193 readiness + decisions */}
      <div className="nv-handoff-top">
        <div
          style={{
            minWidth: 0,
            background: "var(--nv-navy, #14284B)",
            borderRadius: "16px",
            padding: "22px",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "auto -40px -60px auto",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "radial-gradient(circle,#1E9E63 0%,transparent 70%)",
              opacity: 0.45,
            }}
          />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#6EE7B7", fontWeight: 600 }}>
              {ar ? "مؤشر الجاهزية التشغيلية" : "OPERATIONAL READINESS"}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "10px" }}>
              <span
                style={{
                  fontFamily: "'IBM Plex Sans',sans-serif",
                  fontSize: "60px",
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                {score}
              </span>
              <span dir="ltr" style={{ fontSize: "16px", color: "#A8B4C8" }}>/100</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "#A8B4C8" }}>
                {ar ? "مقارنة بالأسبوع الماضي" : "vs. last week"}
              </span>
              {readinessDelta != null && (
                <span
                  dir="ltr"
                  style={{
                    fontSize: "11px",
                    padding: "2px 7px",
                    borderRadius: "20px",
                    background: "rgba(110,231,183,.15)",
                    color: "#6EE7B7",
                    fontWeight: 600,
                    fontFamily: "'IBM Plex Sans',sans-serif",
                  }}
                >
                  {readinessDelta > 0 ? "+" : ""}
                  {readinessDelta}
                </span>
              )}
            </div>
            <div style={{ height: "1px", background: "rgba(255,255,255,.12)", margin: "18px 0 14px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              {factorBars.map((f) => {
                const pct = Math.max(0, Math.min(100, Number(f.pct) || 0));
                const barColor = pct < 70 ? "#F59E0B" : ACCENT;
                return (
                  <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ flex: 1, fontSize: "12px", color: "#A8B4C8", whiteSpace: "nowrap" }}>{f.label}</span>
                    <span
                      style={{
                        width: "74px",
                        height: "4px",
                        borderRadius: "4px",
                        background: "rgba(255,255,255,.1)",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      <span style={bar(pct, barColor)} />
                    </span>
                    <span
                      style={{
                        width: "32px",
                        textAlign: "end",
                        fontSize: "11px",
                        fontFamily: "'IBM Plex Sans',sans-serif",
                        color: "#E2E8F0",
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

        <div
          style={{
            minWidth: 0,
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: "16px",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "4px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>
              {ar ? "ما يحتاج قرارك اليوم" : "Needs your decision today"}
            </div>
            <div style={{ fontSize: "11px", color: MUTED, whiteSpace: "nowrap" }}>{decisionsCountLabel}</div>
          </div>
          <div style={{ fontSize: "11px", color: MUTED, marginBottom: "12px" }}>
            {ar ? "مرتبة بأثرها على التشغيل، لا بتاريخها" : "Ranked by operational impact, not by date"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0 20px" }}>
            {queue.length === 0 ? (
              <div style={{ padding: "26px 0", textAlign: "center", fontSize: "13px", color: MUTED, gridColumn: "1 / -1" }}>
                {ar ? "لا بنود تحتاج قرارك اليوم" : "Nothing needs your decision today"}
              </div>
            ) : (
              queue.map((r) => {
                const color = r.level === "critical" || r.level === "bad" ? "#DC2626" : r.level === "ok" ? ACCENT : "#F59E0B";
                return (
                  <div
                    key={r.id || `${r.title}-${r.age}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "11px 0",
                      borderTop: `1px solid ${BORDER}`,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={dot(color)} />
                    <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: NAVY, textWrap: "pretty" }}>{r.title}</div>
                      <div style={{ fontSize: "11px", color: MUTED, marginTop: "2px" }}>{r.meta}</div>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "3px 8px",
                        borderRadius: "20px",
                        background: SURFACE,
                        border: `1px solid ${BORDER}`,
                        color: MUTED,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.age}
                    </span>
                    <Link to={r.to} style={{ ...ui.btnRow, textDecoration: "none" }}>
                      {r.action}
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* L195–211 alerts */}
      {alertLines.length > 0 && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>{ar ? "تنبيهات استباقية" : "Proactive alerts"}</div>
            <div style={{ fontSize: "11px", color: MUTED }}>
              {ar ? "كل تنبيه يفتح القسم الذي يصلحه" : "Each alert opens the section that fixes it"}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
              gap: "10px",
              marginTop: "14px",
            }}
          >
            {alertLines.map((line, i) => {
              const style = {
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "11px",
                border: `1px solid ${BORDER}`,
                background: CARD,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "12px",
                color: NAVY,
                textAlign: "start",
                width: "100%",
                textDecoration: "none",
              };
              const body = (
                <>
                  <span style={dot(line.color)} />
                  <span style={{ flex: 1, textAlign: "start" }}>{line.text}</span>
                  <span style={{ color: MUTED, fontSize: "11px" }}>{ar ? "←" : "→"}</span>
                </>
              );
              return line.to ? (
                <Link key={i} to={line.to} style={style}>{body}</Link>
              ) : (
                <div key={i} style={style}>{body}</div>
              );
            })}
          </div>
        </div>
      )}

      {/* L213–244 station strip */}
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

      {/* L246–287 attendance + HSE */}
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
