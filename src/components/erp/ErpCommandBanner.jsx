import React from "react";
import { Link } from "react-router-dom";
import { ACCENT, BORDER, CARD, INK, MUTED, NAVY, NAVY_FILL, SURFACE, num } from "@/lib/platformStyles";

/** Command-center ERP glance — readiness across proof cycle pillars. */
export default function ErpCommandBanner({ ar = true, metrics = {} }) {
  const m = metrics;
  const tiles = [
    {
      label: ar ? "الحضور اليوم" : "Today's attendance",
      value: m.attendanceRate != null ? `${m.attendanceRate}%` : "—",
      hint: ar ? `${m.checkedIn || 0} حاضر · ${m.absentCount || 0} غائب` : `${m.checkedIn || 0} in · ${m.absentCount || 0} out`,
      to: "/app/attendance",
      tone: (m.absentCount || 0) > 0 ? "warn" : "ok",
    },
    {
      label: ar ? "مهام مفتوحة" : "Open tasks",
      value: m.openTasks ?? m.tasks ?? "—",
      hint: (m.escalated || 0) > 0
        ? (ar ? `${m.escalated} في التصعيد` : `${m.escalated} escalated`)
        : (ar ? `${m.completedTasks || 0} مكتملة` : `${m.completedTasks || 0} done`),
      to: (m.escalated || 0) > 0 ? "/app/tasks?filter=escalated" : "/app/tasks",
      tone: (m.escalated || 0) > 0 ? "warn" : ((m.openTasks || 0) >= 3 ? "warn" : null),
    },
    {
      label: ar ? "إثبات / توقيع" : "Proof / signing",
      value: m.signing || "—",
      hint: ar ? "بانتظار الإغلاق" : "Awaiting closure",
      to: "/app/signing",
      tone: (m.signing || 0) > 0 ? "warn" : null,
    },
    {
      label: ar ? "الفروع" : "Stations",
      value: m.stations ?? "—",
      hint: ar ? `${m.employees || 0} موظفًا` : `${m.employees || 0} people`,
      to: "/app/org",
      tone: null,
    },
  ];

  return (
    <section
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${BORDER}`,
        background: CARD,
      }}
    >
      <div aria-hidden style={{ height: 3, background: NAVY_FILL }} />
      <div style={{ padding: "16px 18px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", fontWeight: 700, color: ACCENT }}>
            NiroVera ERP
          </div>
          <h2 style={{ margin: "6px 0 0", fontSize: 16, fontWeight: 600, color: INK }}>
            {ar ? "جاهزية التشغيل الآن" : "Operational readiness now"}
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: MUTED, lineHeight: 1.55, maxWidth: 420 }}>
            {ar
              ? "من الحضور إلى الختم — كل رقم مشتق من إثبات، لا من تخمين."
              : "From attendance to seal — every figure is derived from proof, not guesswork."}
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 8,
            flex: "2 1 360px",
            minWidth: 0,
          }}
        >
          {tiles.map((tile) => (
            <Link
              key={tile.to}
              to={tile.to}
              style={{
                textDecoration: "none",
                color: "inherit",
                padding: "12px 14px",
                borderRadius: 11,
                background: SURFACE,
                border: `1px solid ${tile.tone === "warn" ? "color-mix(in oklab, #F59E0B 35%, #E2E8F0)" : BORDER}`,
              }}
            >
              <div style={{ fontSize: 10, color: MUTED, fontWeight: 500 }}>{tile.label}</div>
              <div
                style={{
                  ...num(tile.tone === "warn" ? "#B45309" : tile.tone === "ok" ? ACCENT : NAVY),
                  marginTop: 4,
                  fontSize: 20,
                }}
              >
                {tile.value}
              </div>
              <div style={{ marginTop: 4, fontSize: 10, color: MUTED }}>{tile.hint}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
