import React, { useState } from "react";
import FlexOrgCard from "@/components/hr/FlexOrgCard";
import { nodeAccess, stationIdForTreeEmployee } from "@/lib/orgTree";
import { deriveBranchEscalationChain, escalationStationsForEmployee, sharedEscalationLabel } from "@/lib/orgDerivations";

const LINE = "color-mix(in oklab, #14284B 18%, #E8EDF3)";
const STEM = 36;

function escalationStationId(node, data, scopedStationId) {
  if (node.type === "station") return scopedStationId || String(node.refId || "");
  return scopedStationId
    || stationIdForTreeEmployee(data, node.refId)
    || data.employees.find((item) => item.id === node.refId)?.stationId
    || "";
}

function branchComplaintLevel(node, data, scopedStationId) {
  if (node.type !== "employee") return 0;
  const sid = escalationStationId(node, data, scopedStationId);
  if (!sid) return 0;
  const idx = deriveBranchEscalationChain(sid, data)
    .findIndex((step) => String(step.employeeId) === String(node.refId));
  return idx >= 0 ? idx + 1 : 0;
}

export default function FlexOrgBranch({
  node, nodes, data, scopedStationId, canManage, actions, ar,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const children = nodes.filter((item) => (item.parentId || null) === node.id).sort((a, b) => a.order - b.order);
  const employee = node.type === "employee" ? data.employees.find((item) => item.id === node.refId) : null;
  const label = employee?.name
    || (node.type === "employee"
      ? (ar ? "موظف غير موجود" : "Missing employee")
      : data.stations.find((station) => station.id === node.refId)?.name || node.title);
  const access = node.type === "employee" ? nodeAccess(data, node.refId) : null;
  const complaintLevel = branchComplaintLevel(node, data, scopedStationId);
  const escalationSharedLabel = node.type === "employee"
    ? sharedEscalationLabel(escalationStationsForEmployee(node.refId, data).length, ar, complaintLevel)
    : "";

  const branchProps = { nodes, data, scopedStationId, canManage, actions, ar };

  return (
    <div className="flex min-w-max flex-col items-center">
      <FlexOrgCard
        node={node}
        employee={employee}
        label={label}
        access={access}
        canManage={canManage}
        complaintLevel={complaintLevel}
        escalationSharedLabel={escalationSharedLabel}
        ar={ar}
        childrenCount={children.length}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        onToggleEscalation={() => actions.toggleEscalation?.(
          node.refId,
          escalationStationId(node, data, scopedStationId),
          complaintLevel,
        )}
        onOrganize={actions.organize}
        onEditStation={actions.edit}
        onHire={actions.hire}
      />
      {!collapsed && children.length === 1 && (
        <>
          <div style={{ width: 2, height: STEM, background: LINE, borderRadius: 2 }} />
          <FlexOrgBranch node={children[0]} {...branchProps} />
        </>
      )}
      {!collapsed && children.length > 1 && (
        <>
          <div style={{ width: 2, height: STEM, background: LINE, borderRadius: 2 }} />
          <div className="relative flex items-start justify-center gap-10 px-5 pt-9">
            {children.map((child, index) => (
              <div key={child.id} className="relative">
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: -STEM,
                    left: "50%",
                    width: 2,
                    height: STEM,
                    background: LINE,
                    borderRadius: 2,
                    transform: "translateX(-50%)",
                  }}
                />
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: -STEM,
                      insetInlineEnd: "50%",
                      insetInlineStart: -20,
                      height: 2,
                      background: LINE,
                    }}
                  />
                )}
                {index < children.length - 1 && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: -STEM,
                      insetInlineStart: "50%",
                      insetInlineEnd: -20,
                      height: 2,
                      background: LINE,
                    }}
                  />
                )}
                <FlexOrgBranch node={child} {...branchProps} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
