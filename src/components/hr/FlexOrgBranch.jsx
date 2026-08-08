import React, { useState } from "react";
import FlexOrgCard from "@/components/hr/FlexOrgCard";
import { INHERIT_TEMPLATE_ID, grantedCount, inheritedPermissions, samePermissions, templateById, templateLabel } from "@/lib/permissionTemplates";

export default function FlexOrgBranch({ node, nodes, data, escalationChain, canManage, dragging, actions, ar }) {
  const [collapsed, setCollapsed] = useState(false);
  const children = nodes.filter((item) => (item.parentId || null) === node.id).sort((a, b) => a.order - b.order);
  const employee = node.type === "employee" ? data.employees.find((item) => item.id === node.refId) : null;
  const label = employee?.name || (node.type === "employee" ? (ar ? "موظف غير موجود" : "Missing employee") : data.stations.find((station) => station.id === node.refId)?.name || node.title);
  const position = node.type === "employee" ? (data.smartPositions || []).find((item) => item.employeeId === node.refId) : null;
  const template = position?.templateId === INHERIT_TEMPLATE_ID ? { ar: "مثل العقدة الأعلى", en: "Like parent" } : templateById(data, position?.templateId);
  const templatePermissions = position?.templateId === INHERIT_TEMPLATE_ID ? inheritedPermissions(data, node.parentId) : templateById(data, position?.templateId)?.permissions;
  const access = position ? {
    templateName: template ? templateLabel(template, ar) : "",
    granted: grantedCount(position.permissions),
    customized: Boolean(position.templateId) && !samePermissions(position.permissions || {}, templatePermissions || {}),
  } : null;
  // SAP-style: stations cascade vertically under their parent; people stay side by side.
  const stationChildren = children.filter((child) => child.type === "station");
  const peopleChildren = children.filter((child) => child.type !== "station");
  const renderBranch = (child) => <FlexOrgBranch key={child.id} node={child} nodes={nodes} data={data} escalationChain={escalationChain} canManage={canManage} dragging={dragging} actions={actions} ar={ar} />;
  if (!collapsed && stationChildren.length > 0) {
    return <div className="flex min-w-max flex-col items-center">
      <FlexOrgCard node={node} employee={employee} label={label} access={access} canManage={canManage} dragging={dragging} complaintLevel={node.type === "employee" ? escalationChain.indexOf(node.refId) + 1 : 0} ar={ar} childrenCount={children.length} collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} onToggleEscalation={() => actions.toggleEscalation(node.refId)} onDragStart={actions.start} onDragEnd={actions.end} onDrop={actions.drop} onEdit={actions.edit} />
      {peopleChildren.length > 0 && <><div className="h-8 w-px bg-accent/40" /><div className="flex items-start justify-center gap-8">{peopleChildren.map(renderBranch)}</div></>}
      <div className="h-6 w-px bg-accent/40" />
      <div className="relative flex flex-col gap-6 border-s-2 border-accent/35 ps-8 pt-2">
        {stationChildren.map((child) => <div key={child.id} className="relative before:absolute before:-start-8 before:top-8 before:h-px before:w-8 before:bg-accent/35">{renderBranch(child)}</div>)}
      </div>
    </div>;
  }
  return <div className="flex min-w-max flex-col items-center">
    <FlexOrgCard node={node} employee={employee} label={label} access={access} canManage={canManage} dragging={dragging} complaintLevel={node.type === "employee" ? escalationChain.indexOf(node.refId) + 1 : 0} ar={ar} childrenCount={children.length} collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} onToggleEscalation={() => actions.toggleEscalation(node.refId)} onDragStart={actions.start} onDragEnd={actions.end} onDrop={actions.drop} onEdit={actions.edit} />
    {!collapsed && children.length === 1 && <><div className="h-8 w-px bg-accent/40" /><div><FlexOrgBranch node={children[0]} nodes={nodes} data={data} escalationChain={escalationChain} canManage={canManage} dragging={dragging} actions={actions} ar={ar} /></div></>}
    {!collapsed && children.length > 1 && <><div className="h-8 w-px bg-accent/40" /><div className="relative flex items-start justify-center gap-8 px-6 pt-8">{children.map((child, index) => <div key={child.id} className="relative before:absolute before:-top-8 before:left-1/2 before:h-8 before:w-px before:bg-accent/35">{index > 0 && <span aria-hidden="true" className="pointer-events-none absolute -start-4 -top-8 end-1/2 h-px bg-accent/35" />}{index < children.length - 1 && <span aria-hidden="true" className="pointer-events-none absolute -end-4 -top-8 start-1/2 h-px bg-accent/35" />}<FlexOrgBranch node={child} nodes={nodes} data={data} escalationChain={escalationChain} canManage={canManage} dragging={dragging} actions={actions} ar={ar} /></div>)}</div></>}
  </div>;
}