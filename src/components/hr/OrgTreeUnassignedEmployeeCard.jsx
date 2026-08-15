import React from "react";
import { Link } from "react-router-dom";
import { MUTED, NAVY, CARD } from "@/lib/platformStyles";

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "·";
  return `${parts[0][0] || ""}${parts[1]?.[0] || ""}`;
}

export default function OrgTreeUnassignedEmployeeCard({ employee, canManage, actions, ar }) {
  return (
    <button
      type="button"
      disabled={!canManage}
      onClick={() => canManage && actions.organizeEmployee?.(employee.id)}
      style={{
        display: "flex",
        minWidth: 176,
        alignItems: "center",
        gap: 10,
        borderRadius: 999,
        border: "1px solid #E8EDF3",
        background: CARD,
        padding: "6px 12px 6px 6px",
        boxShadow: "0 6px 16px rgba(20,40,75,.05)",
        cursor: canManage ? "pointer" : "default",
        fontFamily: "inherit",
        textAlign: "start",
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "color-mix(in oklab, #14284B 8%, #fff)",
          color: NAVY,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {initials(employee.name)}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <Link
          to={`/app/employees/${encodeURIComponent(employee.id)}`}
          onClick={(event) => event.stopPropagation()}
          style={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: 12,
            fontWeight: 600,
            color: NAVY,
            textDecoration: "none",
          }}
        >
          {employee.name}
        </Link>
        <span style={{ display: "block", marginTop: 2, fontSize: 10, color: MUTED }}>
          {ar ? "بانتظار التنظيم" : "Needs placement"}
        </span>
      </span>
    </button>
  );
}
