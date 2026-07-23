import React from "react";
import { Building2, GripVertical, ShieldCheck, UserRound } from "lucide-react";
import ComplaintEscalationBadge from "@/components/hr/ComplaintEscalationBadge";
import OrgTreeDropZones from "@/components/hr/OrgTreeDropZones";

export default function FreeOrgNodeCard({ node, label, canManage, complaintLevel, ar, active, activeDragId, dragHandlers, suppressClick, onEdit, onToggleEscalation, onHierarchyDrop }) {
  const station = node.type === "station";
  return <div className={`relative w-56 ${active ? "z-20" : "z-10"}`} dir={ar ? "rtl" : "ltr"}>
    {!station && <ComplaintEscalationBadge level={complaintLevel} canManage={canManage} ar={ar} onToggle={onToggleEscalation} />}
    <button type="button" {...dragHandlers} onClick={(event) => { if (suppressClick()) event.preventDefault(); else onEdit(node); }} className={`w-full touch-none select-none rounded-lg border p-3 text-start shadow-md ${canManage ? "cursor-grab active:cursor-grabbing" : ""} ${station ? "border-accent/50 bg-primary text-primary-foreground" : "border-border bg-card hover:border-accent/60"}`}>
      <span className="flex items-center gap-2.5">
        {canManage && <GripVertical className={`h-4 w-4 shrink-0 ${station ? "text-primary-foreground/55" : "text-muted-foreground"}`} />}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">{station ? <Building2 className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{label}</span><span className={`mt-0.5 flex items-center gap-1 truncate text-[10px] ${station ? "text-primary-foreground/65" : "text-muted-foreground"}`}>{!station && <ShieldCheck className="h-3 w-3" />}{node.title || (ar ? "بدون مسمى" : "Untitled")}</span></span>
      </span>
    </button>
    <OrgTreeDropZones active={activeDragId && activeDragId !== node.id} targetId={node.id} onDrop={(mode) => onHierarchyDrop(activeDragId, node.id, mode)} ar={ar} />
  </div>;
}