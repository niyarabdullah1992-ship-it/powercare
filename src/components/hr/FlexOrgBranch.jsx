import React, { useState } from "react";
import FlexOrgCard from "@/components/hr/FlexOrgCard";
import { getOrgRankDefinition, resolveRank } from "@/lib/orgTreeRank";

export default function FlexOrgBranch({ node, nodes, data, escalationChain, canManage, dragging, actions, ar, lang }) {
  const [collapsed, setCollapsed] = useState(false);
  const children = nodes.filter((item) => (item.parentId || null) === node.id).sort((a, b) => a.order - b.order);
  const employee = node.type === "employee" ? data.employees.find((item) => item.id === node.refId) : null;
  const station = node.type === "station" ? data.stations.find((item) => item.id === node.refId) : null;
  const stationManager = station?.managerId ? data.employees.find((item) => item.id === station.managerId) : null;
  const isHierarchyManager = Boolean(employee && children.some((child) => child.type === "employee"));
  const label = employee?.name || (node.type === "employee" ? (ar ? "موظف غير موجود" : "Missing employee") : station?.name || node.title);
  const rank = getOrgRankDefinition(data.orgRanks, resolveRank(node, nodes, data.orgRanks));
  return <div className="flex min-w-max flex-col items-center">
    <FlexOrgCard node={node} employee={employee} label={label} rank={rank} owner={employee?.id === data.ownerId} stationManagerName={stationManager?.name} isHierarchyManager={isHierarchyManager} canManage={canManage} lang={lang} dragging={dragging} complaintLevel={node.type === "employee" ? escalationChain.indexOf(node.refId) + 1 : 0} ar={ar} childrenCount={children.length} collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} onToggleEscalation={() => actions.toggleEscalation(node.refId)} onDragStart={actions.start} onDragEnd={actions.end} onDrop={actions.drop} onEdit={actions.edit} />
    {!collapsed && children.length > 0 && <><div className="h-8 w-px bg-accent/40" /><div className="relative flex items-start justify-center gap-8 border-t border-accent/35 px-6 pt-8">{children.map((child) => <div key={child.id} className="relative before:absolute before:-top-8 before:left-1/2 before:h-8 before:w-px before:bg-accent/35"><FlexOrgBranch node={child} nodes={nodes} data={data} escalationChain={escalationChain} canManage={canManage} dragging={dragging} actions={actions} ar={ar} lang={lang} /></div>)}</div></>}
  </div>;
}