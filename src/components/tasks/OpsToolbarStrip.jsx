import React from "react";
import { BORDER, BRAND, BRAND_DEEP, BRAND_SOFT, CARD, MUTED, ui } from "@/lib/platformStyles";

const OUTER = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

function filterChipStyle(active) {
  return {
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12px",
    whiteSpace: "nowrap",
    padding: "7px 14px",
    borderRadius: "9px",
    ...(active
      ? {
          border: `1px solid ${BRAND}`,
          background: BRAND_SOFT,
          color: BRAND_DEEP,
          fontWeight: 600,
        }
      : {
          border: `1px solid ${BORDER}`,
          background: CARD,
          color: MUTED,
        }),
  };
}

export default function OpsToolbarStrip({
  ar,
  dir,
  viewMode,
  onViewModeChange,
  filter,
  onFilterChange,
  chips,
  showCreate,
  onToggleCreate,
}) {
  const viewTabs = [
    { id: "list", label: ar ? "قائمة" : "List" },
    { id: "plan", label: ar ? "الخطة" : "Plan" },
  ];

  return (
    <div dir={dir} style={OUTER}>
      <div className="nv-tabrail">
        {viewTabs.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onViewModeChange(v.id)}
            aria-current={viewMode === v.id ? "true" : undefined}
            data-active={viewMode === v.id ? "true" : undefined}
          >
            {v.label}
          </button>
        ))}
      </div>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onFilterChange(chip.id)}
          style={filterChipStyle(filter === chip.id)}
        >
          {chip.label}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button type="button" onClick={onToggleCreate} style={ui.btnPrimary}>
        {showCreate ? (ar ? "إخفاء النموذج" : "Hide form") : (ar ? "مهمة جديدة" : "New task")}
      </button>
    </div>
  );
}
