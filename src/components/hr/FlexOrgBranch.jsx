import React, { useLayoutEffect, useRef, useState } from "react";
import FlexOrgCard from "@/components/hr/FlexOrgCard";

export default function FlexOrgBranch({ node, nodes, data, escalationChain, canManage, dragging, actions, ar }) {
  const [collapsed, setCollapsed] = useState(false);
  const children = nodes.filter((item) => (item.parentId || null) === node.id).sort((a, b) => a.order - b.order);
  const employee = node.type === "employee" ? data.employees.find((item) => item.id === node.refId) : null;
  const childrenRowRef = useRef(null);
  const [connector, setConnector] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const row = childrenRowRef.current;
    if (!row || children.length < 2 || collapsed) return;
    const first = row.querySelector('[data-org-child="first"]');
    const last = row.querySelector('[data-org-child="last"]');
    const measure = () => {
      const left = first.offsetLeft + first.offsetWidth / 2;
      const right = last.offsetLeft + last.offsetWidth / 2;
      setConnector({ left, width: right - left });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    observer.observe(first);
    observer.observe(last);
    return () => observer.disconnect();
  }, [children.length, children[0]?.id, children[children.length - 1]?.id, collapsed]);

  const label = employee?.name || (node.type === "employee" ? (ar ? "موظف غير موجود" : "Missing employee") : data.stations.find((station) => station.id === node.refId)?.name || node.title);
  return <div className="flex min-w-max flex-col items-center">
    <FlexOrgCard node={node} employee={employee} label={label} canManage={canManage} dragging={dragging} complaintLevel={node.type === "employee" ? escalationChain.indexOf(node.refId) + 1 : 0} ar={ar} childrenCount={children.length} collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} onToggleEscalation={() => actions.toggleEscalation(node.refId)} onDragStart={actions.start} onDragEnd={actions.end} onDrop={actions.drop} onEdit={actions.edit} />
    {!collapsed && children.length === 1 && <><div className="h-8 w-px bg-accent/40" /><div><FlexOrgBranch node={children[0]} nodes={nodes} data={data} escalationChain={escalationChain} canManage={canManage} dragging={dragging} actions={actions} ar={ar} /></div></>}
    {!collapsed && children.length > 1 && <><div className="h-8 w-px bg-accent/40" /><div ref={childrenRowRef} className="relative flex items-start justify-center gap-8 pt-8"><div className="absolute top-0 h-px bg-accent/35" style={{ left: connector.left, width: connector.width }} />{children.map((child, index) => <div key={child.id} data-org-child={index === 0 ? "first" : index === children.length - 1 ? "last" : "middle"} className="relative before:absolute before:-top-8 before:left-1/2 before:h-8 before:w-px before:bg-accent/35"><FlexOrgBranch node={child} nodes={nodes} data={data} escalationChain={escalationChain} canManage={canManage} dragging={dragging} actions={actions} ar={ar} /></div>)}</div></>}
  </div>;
}