import React from "react";
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import ComplaintEscalationBadge from "@/components/hr/ComplaintEscalationBadge";
import OrgCardIdentityMeta from "@/components/hr/OrgCardIdentityMeta";
import OrgTreeDropZones from "@/components/hr/OrgTreeDropZones";
import useOrgNodeDrag from "@/hooks/useOrgNodeDrag";

export default function FlexOrgCard({ node, label, stationManagerName, isStationManager, isHierarchyManager, canManage, dragging, reorderActive, complaintLevel, childrenCount, collapsed, onToggleCollapse, onToggleEscalation, onDragStart, onDragEnd, onDrop, onEdit, ar }) {
  const station = node.type === "station";
  const touchDrag = useOrgNodeDrag(node.id, canManage, onDragStart, onDragEnd, onDrop);
  return <div className={`relative mx-auto ${station ? "w-64" : "w-56"}`} onDragEnter={(event) => event.preventDefault()}>
    {!station && <ComplaintEscalationBadge level={complaintLevel} canManage={canManage} ar={ar} onToggle={onToggleEscalation} />}
    <div role="button" tabIndex={0} draggable={canManage} {...touchDrag.handlers} onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", node.id); onDragStart(node.id); }} onDragEnd={onDragEnd} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onEdit(node); }} onClick={(event) => { if (touchDrag.suppressClick()) event.preventDefault(); else onEdit(node); }} className={`relative w-full cursor-grab select-none rounded-lg border p-3 text-start transition active:cursor-grabbing ${station ? "border-2 border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card text-card-foreground shadow-sm hover:border-accent/60"}`}>
      <span className="flex items-center gap-2.5">
        {canManage && <GripVertical className={`h-4 w-4 shrink-0 ${station ? "text-primary-foreground/55" : "text-muted-foreground"}`} />}
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{label}</span><OrgCardIdentityMeta station={station} managerName={stationManagerName} isStationManager={isStationManager} isHierarchyManager={isHierarchyManager} ar={ar} /></span>
      </span>
    </div>
    {childrenCount > 0 && <button type="button" onClick={onToggleCollapse} className="absolute -end-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-accent/40 bg-card text-accent shadow-sm" title={collapsed ? (ar ? "إظهار الفروع" : "Expand branches") : (ar ? "طي الفروع" : "Collapse branches")} aria-label={collapsed ? (ar ? "إظهار الفروع" : "Expand branches") : (ar ? "طي الفروع" : "Collapse branches")}>
      {collapsed ? <ChevronRight className="h-4 w-4 rtl:rotate-180" /> : <ChevronDown className="h-4 w-4" />}
    </button>}
    <OrgTreeDropZones active={reorderActive} targetId={node.id} onDrop={(mode, sourceId) => onDrop(node.id, mode, sourceId)} ar={ar} />
  </div>;
}