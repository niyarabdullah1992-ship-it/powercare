import React from "react";
import { ACCENT, MUTED, NAVY, statCard } from "@/lib/platformStyles";

/** Platform.dc.html L395–405 — attendance KPI grid */
const GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
  gap: "12px",
};

const KPI_CARD = {
  ...statCard,
  borderRadius: "13px",
};

const LABEL = {
  fontSize: "11px",
  color: MUTED,
};

const VALUE_ROW = {
  display: "flex",
  alignItems: "baseline",
  gap: "6px",
  marginTop: "8px",
  flexWrap: "wrap",
};

const SUFFIX = {
  fontSize: "11px",
  color: MUTED,
};

function valueStyle(color = NAVY) {
  return {
    fontFamily: "'IBM Plex Sans',sans-serif",
    fontSize: "26px",
    fontWeight: 600,
    lineHeight: 1,
    color,
  };
}

/**
 * @param {{ items: Array<{ label: string, value: string, suffix?: string, accent?: boolean, hot?: boolean }> }} props
 */
export default function AttendanceKpiStrip({ items = [] }) {
  if (!items.length) return null;

  return (
    <div style={GRID} data-testid="attendance-kpi-strip">
      {items.map((item) => {
        const color = item.hot ? "#DC2626" : item.accent ? ACCENT : item.color || NAVY;
        return (
          <div key={item.label} style={KPI_CARD}>
            <div style={LABEL}>{item.label}</div>
            <div style={VALUE_ROW}>
              <span style={valueStyle(color)}>{item.value}</span>
              {item.suffix ? <span style={SUFFIX}>{item.suffix}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
