import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";
import ComplaintEscalationBadge from "@/components/hr/ComplaintEscalationBadge";
import { identityIconWrap } from "@/components/shared/IdentityCard";
import { BORDER, MUTED, NAVY, NAVY_FILL, CARD } from "@/lib/platformStyles";

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "·";
  return `${parts[0][0] || ""}${parts[1]?.[0] || ""}`;
}

function personTitle(node, employee, ar) {
  const titled = String(node.title || employee?.profile?.position || employee?.position || "").trim();
  if (titled) return titled;
  if (employee?.isOwner || employee?.role === "owner") return ar ? "المالك" : "Owner";
  if (employee?.role === "station_manager") return ar ? "مدير الفرع" : "Branch manager";
  return "";
}

const cardShadow = "0 8px 24px rgba(20,40,75,.06)";

/** Org node — IdentityCard language: navy rail, place vs person. Green is status only. */
export default function FlexOrgCard({
  node, employee, label, access, canManage, complaintLevel, escalationSharedLabel,
  childrenCount, collapsed, onToggleCollapse, onToggleEscalation,
  onOrganize, onEditStation, ar,
}) {
  const navigate = useNavigate();
  const station = node.type === "station";
  const isHr = !station && access?.hr === "manage";
  const subtitle = station
    ? (childrenCount > 0
      ? (ar ? `${childrenCount} في هذا الفرع` : `${childrenCount} in this branch`)
      : (ar ? "فرع تشغيلي" : "Operating branch"))
    : personTitle(node, employee, ar);

  const openNode = () => {
    if (station) onEditStation?.(node);
    else if (canManage) onOrganize?.(node);
    else if (employee?.id) navigate(`/app/employees/${employee.id}`);
  };

  return (
    <div className="relative mx-auto" style={{ width: station ? 200 : 196 }} data-org-hit={node.id}>
      {!station && (
        <ComplaintEscalationBadge
          level={complaintLevel}
          sharedLabel={escalationSharedLabel}
          canManage={canManage}
          ar={ar}
          onToggle={onToggleEscalation}
        />
      )}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") openNode();
        }}
        onClick={openNode}
        style={{
          width: "100%",
          cursor: "pointer",
          userSelect: "none",
          borderRadius: 16,
          border: `1px solid ${BORDER}`,
          background: CARD,
          overflow: "hidden",
          textAlign: "start",
          boxShadow: cardShadow,
          transition: "transform .16s ease, box-shadow .16s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 14px 32px rgba(20,40,75,.10)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = cardShadow;
        }}
      >
        <div aria-hidden style={{ height: 3, background: NAVY_FILL }} />
        {station ? (
          <div style={{ padding: "14px 14px 16px", textAlign: "center" }}>
            <span style={{ ...identityIconWrap, margin: "0 auto 10px" }}>
              <MapPin style={{ width: 18, height: 18 }} strokeWidth={1.75} />
            </span>
            <span
              style={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 14,
                fontWeight: 600,
                color: NAVY,
              }}
            >
              {label}
            </span>
            <span style={{ display: "block", marginTop: 4, fontSize: 11, color: MUTED, lineHeight: 1.4 }}>
              {subtitle}
            </span>
          </div>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px" }}>
            <Link
              to={`/app/employees/${employee?.id}`}
              onClick={(event) => event.stopPropagation()}
              aria-label={ar ? `فتح ملف ${label}` : `Open ${label}'s profile`}
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: 11,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#EEF2F6",
                color: NAVY,
                border: `1px solid ${BORDER}`,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {employee?.profile?.avatarUrl ? (
                <Image src={employee.profile.avatarUrl} alt={label} fittingType="fill" className="h-full w-full" />
              ) : (
                initials(label)
              )}
            </Link>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 13,
                  fontWeight: 600,
                  color: NAVY,
                }}
              >
                {label}
              </span>
              {(subtitle || isHr) && (
                <span
                  style={{
                    display: "block",
                    marginTop: 3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 11,
                    color: MUTED,
                    lineHeight: 1.4,
                  }}
                >
                  {subtitle || (ar ? "موارد بشرية" : "HR")}
                </span>
              )}
            </span>
          </span>
        )}
      </div>

      {childrenCount > 0 && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? (ar ? "إظهار" : "Expand") : (ar ? "طي" : "Collapse")}
          style={{
            position: "absolute",
            left: "50%",
            bottom: -11,
            zIndex: 10,
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            border: `1px solid ${BORDER}`,
            background: CARD,
            color: MUTED,
            boxShadow: "0 4px 10px rgba(20,40,75,.08)",
            cursor: "pointer",
            transform: "translateX(-50%)",
          }}
        >
          {collapsed
            ? <ChevronRight className="h-3 w-3 rtl:rotate-180" strokeWidth={2} />
            : <ChevronDown className="h-3 w-3" strokeWidth={2} />}
        </button>
      )}
    </div>
  );
}
