import React from "react";
import TimeFormatToggle from "@/components/attendance/TimeFormatToggle";
import AttHubTabRail from "@/components/attendance/AttHubTabRail";
import { ACCENT, BORDER, CARD, NAVY } from "@/lib/platformStyles";

function AttendanceDateChip({ lang }) {
  const ar = lang === "ar";
  const label = new Date().toLocaleDateString(ar ? "ar" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: "gregory",
  });

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 34,
        padding: "0 12px",
        borderRadius: 9,
        border: `1px solid ${BORDER}`,
        background: CARD,
        fontSize: 12,
        color: NAVY,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <span>{label}</span>
      <span style={{ width: 1, height: 14, background: BORDER }} />
      <span style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>{ar ? "اليوم" : "Today"}</span>
    </div>
  );
}

/**
 * Primary attendance hub chrome — one tab rail, date chip, 12/24 toggle.
 */
export default function AttendanceExtraToolbar({
  lang,
  tabs = [],
  activeTab,
  onSelect,
}) {
  const ar = lang === "ar";
  if (!tabs.length) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 12,
        border: `1px solid ${BORDER}`,
        background: CARD,
        boxShadow: "0 1px 3px rgba(20, 40, 75, 0.06)",
      }}
      dir={ar ? "rtl" : "ltr"}
    >
      <AttHubTabRail
        dir={ar ? "rtl" : "ltr"}
        tabs={tabs}
        active={activeTab}
        onChange={onSelect}
      />
      <span style={{ flex: 1, minWidth: 8 }} />
      <AttendanceDateChip lang={lang} />
      <TimeFormatToggle lang={lang} />
    </div>
  );
}
