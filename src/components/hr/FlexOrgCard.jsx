import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { Building2, ChevronDown, ChevronRight, GripVertical, UserRound } from "lucide-react";
import ComplaintEscalationBadge from "@/components/hr/ComplaintEscalationBadge";
import OrgCardIdentityMeta from "@/components/hr/OrgCardIdentityMeta";
import OrgTreeDropZones from "@/components/hr/OrgTreeDropZones";
import useOrgNodeDrag from "@/hooks/useOrgNodeDrag";

export default function FlexOrgCard({ node, employee, label, rank, owner, stationManagerName, isStationManager, canManage, lang, dragging, complaintLevel, childrenCount, collapsed, onToggleCollapse, onToggleEscalation, onDragStart, onDragEnd, onDrop, onEdit, ar }) {
  const station = node.type === "station";
  const touchDrag = useOrgNodeDrag(node.id, canManage, onDragStart, onDragEnd, onDrop);
  return <div className={`relative mx-auto ${owner || rank?.index === 0 ? "w-64" : "w-56"}`} onDragEnter={(event) => event.preventDefault()}>
    {!station && <ComplaintEscalationBadge level={complaintLevel} canManage={canManage} ar={ar} onToggle={onToggleEscalation} />}
    <div role="button" tabIndex={0} draggable={canManage} {...touchDrag.handlers} onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", node.id); onDragStart(node.id); }} onDragEnd={onDragEnd} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onEdit(node); }} onClick={(event) => { if (touchDrag.suppressClick()) event.preventDefault(); else onEdit(node); }} className={`relative w-full cursor-grab select-none rounded-lg border p-3 text-start transition active:cursor-grabbing ${station ? "border-2 border-primary bg-accent text-accent-foreground shadow-md" : "border-border bg-card shadow-sm hover:border-accent/60"}`}>
      <span className="flex items-center gap-2.5">
        {canManage && <GripVertical className={`h-4 w-4 shrink-0 ${station ? "text-accent-foreground/55" : "text-muted-foreground"}`} />}
        {station ? <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Building2 className="h-4 w-4" /></span> : <Link to={`/app/employees/${employee?.id}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/10 text-accent ring-2 ring-transparent hover:ring-accent" aria-label={ar ? `فتح ملف ${label}` : `Open ${label}'s profile`}>{employee?.profile?.avatarUrl ? <Image src={employee.profile.avatarUrl} alt={label} fittingType="fill" className="h-full w-full" /> : <UserRound className="h-4 w-4" />}</Link>}
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{label}</span><OrgCardIdentityMeta station={station} managerName={stationManagerName} rank={rank} isStationManager={isStationManager} lang={lang} ar={ar} /></span>
      </span>
    </div>
    {childrenCount > 0 && <button type="button" onClick={onToggleCollapse} className="absolute -end-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-accent/40 bg-card text-accent shadow-sm" title={collapsed ? (ar ? "إظهار الفروع" : "Expand branches") : (ar ? "طي الفروع" : "Collapse branches")} aria-label={collapsed ? (ar ? "إظهار الفروع" : "Expand branches") : (ar ? "طي الفروع" : "Collapse branches")}>
      {collapsed ? <ChevronRight className="h-4 w-4 rtl:rotate-180" /> : <ChevronDown className="h-4 w-4" />}
    </button>}
    <OrgTreeDropZones active={dragging && dragging !== node.id} targetId={node.id} onDrop={(mode) => onDrop(node.id, mode)} ar={ar} />
  </div>;
}