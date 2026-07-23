import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import FlexOrgCard from "@/components/hr/FlexOrgCard";

export default function FlexOrgBranch({ node, nodes, data, escalationChain, canManage, dragging, actions, ar }) {
  const [expanded, setExpanded] = useState(true);
  const children = nodes.filter((item) => (item.parentId || null) === node.id).sort((a, b) => a.order - b.order);
  const label = node.type === "employee" ? data.employees.find((employee) => employee.id === node.refId)?.name || (ar ? "موظف غير موجود" : "Missing employee") : data.stations.find((station) => station.id === node.refId)?.name || node.title;
  return <div className="flex min-w-max flex-col items-center">
    <FlexOrgCard node={node} label={label} canManage={canManage} dragging={dragging} complaintLevel={node.type === "employee" ? escalationChain.indexOf(node.refId) + 1 : 0} ar={ar} onToggleEscalation={() => actions.toggleEscalation(node.refId)} onDragStart={actions.start} onDragEnd={actions.end} onDrop={actions.drop} onEdit={actions.edit} />
    {children.length > 0 && <button type="button" onClick={() => setExpanded(!expanded)} title={expanded ? (ar ? "طي الفرع" : "Collapse branch") : (ar ? "فرد الفرع" : "Expand branch")} aria-expanded={expanded} className="mt-2 flex items-center gap-1 rounded-full border border-accent/40 bg-card px-2.5 py-1 text-[10px] font-semibold text-accent shadow-sm">{expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}{expanded ? (ar ? "طي" : "Collapse") : `${ar ? "عرض" : "Show"} (${children.length})`}</button>}
    {expanded && children.length > 0 && <><div className="h-6 w-px bg-accent/40" /><div className="relative flex items-start justify-center gap-8 border-t border-accent/35 px-6 pt-8">{children.map((child) => <div key={child.id} className="relative before:absolute before:-top-8 before:left-1/2 before:h-8 before:w-px before:bg-accent/35"><FlexOrgBranch node={child} nodes={nodes} data={data} escalationChain={escalationChain} canManage={canManage} dragging={dragging} actions={actions} ar={ar} /></div>)}</div></>}
  </div>;
}