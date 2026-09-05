import React from "react";
import { ACCENT, DANGER, INK, MUTED, NAVY, statCard, num } from "@/lib/platformStyles";

/**
 * @param {{ ar?: boolean, stats: { label: string, value: string | number, hint?: string, tone?: "ok" | "warn" | "danger" | null }[] }} props
 */
export default function ErpKpiStrip({ stats = [] }) {
  if (!stats.length) return null;

  const valueColor = (tone) => {
    if (tone === "danger") return DANGER;
    if (tone === "warn") return "#B45309";
    if (tone === "ok") return ACCENT;
    return INK;
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))",
        gap: 10,
      }}
    >
      {stats.map((item) => (
        <div
          key={item.label}
          style={{
            ...statCard,
            borderRadius: 12,
            padding: "14px 16px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              insetInlineStart: 0,
              width: 3,
              height: "100%",
              background: item.tone === "danger" ? DANGER : item.tone === "warn" ? "#F59E0B" : NAVY,
              opacity: 0.85,
            }}
          />
          <div style={{ fontSize: 11, fontWeight: 500, color: MUTED, letterSpacing: "0.02em" }}>
            {item.label}
          </div>
          <div style={{ ...num(valueColor(item.tone)), marginTop: 6, fontSize: 22 }}>
            {item.value}
          </div>
          {item.hint ? (
            <div style={{ marginTop: 5, fontSize: 10, color: MUTED, lineHeight: 1.45 }}>
              {item.hint}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
