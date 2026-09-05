import React from "react";
import AttHubTabRail from "@/components/attendance/AttHubTabRail";
import { BORDER, CARD } from "@/lib/platformStyles";

/**
 * Primary attendance hub chrome — tab rail only.
 * Date, live clock, and 12/24 live in the global header.
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
    </div>
  );
}
