import React from "react";
import HROrgNodeCard from "@/components/hr/HROrgNodeCard";

export default function HROrgBranch({ node, nodes, data, dragging, canManage, lang, actions }) {
  const children = nodes.filter((item) => item.parentId === node.id).sort((a, b) => a.order - b.order);
  return <div className="flex min-w-max flex-col items-center">
    <HROrgNodeCard node={node} data={data} dragging={dragging} canManage={canManage} lang={lang} actions={actions} />
    {children.length > 0 && <><div className="h-8 w-px bg-accent/40" /><div className="relative flex items-start justify-center gap-8 border-t border-accent/35 px-6 pt-8">{children.map((child) => <div key={child.id} className="relative before:absolute before:-top-8 before:left-1/2 before:h-8 before:w-px before:bg-accent/35"><HROrgBranch node={child} nodes={nodes} data={data} dragging={dragging} canManage={canManage} lang={lang} actions={actions} /></div>)}</div></>}
  </div>;
}