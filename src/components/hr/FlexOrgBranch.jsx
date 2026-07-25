import React, { useState } from "react";
import FlexOrgCard from "@/components/hr/FlexOrgCard";

export default function FlexOrgBranch({ node, nodes, data, escalationChain, canManage, dragging, actions, ar }) {
  const [collapsed, setCollapsed] = useState(false);
  const children = nodes.filter((item) => (item.parentId || null) === node.id).sort((a, b) => a.order - b.order);
  const employee = node.type === "employee" ? data.employees.find((item) => item.id === node.refId) : null;
  const label = employee?.name || (node.type === "employee" ? (ar ? "موظف غير موجود" : "Missing employee") : data.stations.find((station) => station.id === node.refId)?.name || node.title);
  return <div className="flex min-w-max flex-col items-center">
    <FlexOrgCard node={node} employee={employee} label={label} canManage={canManage} dragging={dragging} complaintLevel={node.type === "employee" ? escalationChain.indexOf(node.refId) + 1 : 0} ar={ar} childrenCount={children.length} collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} onToggleEscalation={() => actions.toggleEscalation(node.refId)} onDragStart={actions.start} onDragEnd={actions.end} onDrop={actions.drop} onEdit={actions.edit} />
    {!collapsed && children.length > 0 && <>
      <div className="h-8 w-px bg-accent/40" />
      <div className="relative flex items-start justify-center gap-8 pt-8">
        {children.map((child, index) => {
          const connector = children.length === 1
            ? ""
            : index === 0
              ? "after:absolute after:top-[-2rem] after:left-1/2 after:-right-4 after:h-px after:bg-accent/35"
              : index === children.length - 1
                ? "after:absolute after:top-[-2rem] after:-left-4 after:right-1/2 after:h-px after:bg-accent/35"
                : "after:absolute after:top-[-2rem] after:-left-4 after:-right-4 after:h-px after:bg-accent/35";
          return <div key={child.id} className={`relative before:absolute before:-top-8 before:left-1/2 before:h-8 before:w-px before:bg-accent/35 ${connector}`}><FlexOrgBranch node={child} nodes={nodes} data={data} escalationChain={escalationChain} canManage={canManage} dragging={dragging} actions={actions} ar={ar} /></div>;
        })}
      </div>
    </>}
  </div>;
}