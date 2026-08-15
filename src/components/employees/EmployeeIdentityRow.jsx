import React from "react";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";
import { identityIconWrap } from "@/components/shared/IdentityCard";
import { MUTED, NAVY } from "@/lib/platformStyles";

function initialsFrom(name = "") {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

/** Shared person chip — same navy tile as IdentityCard, one file link across boards. */
export default function EmployeeIdentityRow({
  employee,
  employeeId,
  name,
  subtitle,
  showId = true,
  compact = false,
  link = true,
}) {
  const displayName = employee?.name || name || "—";
  const id = employee?.id || employeeId || null;
  const avatar = employee?.profile?.avatarUrl || employee?.avatarUrl;
  const size = compact ? 28 : 36;
  const initials = initialsFrom(displayName);
  const nameStyle = {
    display: "block",
    fontSize: compact ? 12 : 13,
    fontWeight: 600,
    color: NAVY,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 10, minWidth: 0 }}>
      <span
        style={{
          ...identityIconWrap,
          width: size,
          height: size,
          borderRadius: compact ? 8 : 10,
          fontSize: compact ? 10 : 11,
          fontWeight: 600,
          fontFamily: "'IBM Plex Sans',sans-serif",
          overflow: "hidden",
        }}
      >
        {avatar
          ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : initials}
      </span>
      <div style={{ minWidth: 0 }}>
        {link && id ? (
          <EmployeeNameLink employeeId={id} employeeName={displayName} style={nameStyle} />
        ) : (
          <div style={nameStyle}>{displayName}</div>
        )}
        {showId && id ? (
          <div style={{ fontSize: 11, color: MUTED, fontFamily: "'IBM Plex Mono',monospace" }} dir="ltr">
            {id}
          </div>
        ) : null}
        {subtitle ? (
          <div style={{ fontSize: 11, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
