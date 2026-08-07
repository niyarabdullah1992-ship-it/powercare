import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { Building2, ChevronDown, ChevronRight, GripVertical, ShieldCheck, UserCog, UserRound } from "lucide-react";
import ComplaintEscalationBadge from "@/components/hr/ComplaintEscalationBadge";
import OrgTreeDropZones from "@/components/hr/OrgTreeDropZones";
import NodeAccessSummary from "@/components/hr/NodeAccessSummary";
import useOrgNodeDrag from "@/hooks/useOrgNodeDrag";

export default function FlexOrgCard({ node, employee, label, access, canManage, dragging, complaintLevel, childrenCount, collapsed, onToggleCollapse, onToggleEscalation, onDragStart, onDragEnd, onDrop, onEdit, ar }) {
  const navigate = useNavigate();
  const station = node.type === "station";
  const assigningUnassigned = typeof dragging === "string" && dragging.startsWith("unassigned:");
  const openNode = () => station ? onEdit(node) : employee?.id && navigate(`/app/employees/${employee.id}`);
  const touchDrag = useOrgNodeDrag(node.id, canManage, onDragStart, onDragEnd, onDrop);
  return <div className="relative mx-auto w-56" onDragEnter={(event) => event.preventDefault()}>
    {!station && <ComplaintEscalationBadge level={complaintLevel} canManage={canManage} ar={ar} onToggle={onToggleEscalation} />}
    <div role="button" tabIndex={0} {...touchDrag.handlers} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openNode(); }} onClick={(event) => { if (touchDrag.suppressClick()) event.preventDefault(); else openNode(); }} className={`w-full cursor-grab select-none rounded-lg border p-3 text-start transition active:cursor-grabbing ${station ? "border-accent/50 bg-primary text-primary-foreground shadow-md" : "border-border bg-card shadow-sm hover:border-accent/60"}`}>
      <span className="flex items-center gap-2.5">
        {canManage && <GripVertical className={`h-4 w-4 shrink-0 ${station ? "text-primary-foreground/55" : "text-muted-foreground"}`} />}
        {station ? <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent"><Building2 className="h-4 w-4" /></span> : <Link to={`/app/employees/${employee?.id}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/10 text-accent ring-2 ring-transparent hover:ring-accent" aria-label={ar ? `فتح ملف ${label}` : `Open ${label}'s profile`}>{employee?.profile?.avatarUrl ? <Image src={employee.profile.avatarUrl} alt={label} fittingType="fill" className="h-full w-full" /> : <UserRound className="h-4 w-4" />}</Link>}
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{label}</span><span className={`mt-0.5 flex items-center gap-1 truncate text-[10px] ${station ? "text-primary-foreground/65" : "text-muted-foreground"}`}>{!station && <ShieldCheck className="h-3 w-3" />}{node.title || (ar ? "بدون مسمى" : "Untitled")}</span>{access && <NodeAccessSummary {...access} ar={ar} />}</span>
      </span>
    </div>
    {canManage && !station && <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onEdit(node); }} className="absolute -start-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-accent/40 bg-card text-accent shadow-sm" title={ar ? "تعديل حالة المدير" : "Edit manager status"} aria-label={ar ? "تعديل حالة المدير" : "Edit manager status"}><UserCog className="h-4 w-4" /></button>}
    {childrenCount > 0 && <button type="button" onClick={onToggleCollapse} className="absolute -end-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-accent/40 bg-card text-accent shadow-sm" title={collapsed ? (ar ? "إظهار الفروع" : "Expand branches") : (ar ? "طي الفروع" : "Collapse branches")} aria-label={collapsed ? (ar ? "إظهار الفروع" : "Expand branches") : (ar ? "طي الفروع" : "Collapse branches")}>
      {collapsed ? <ChevronRight className="h-4 w-4 rtl:rotate-180" /> : <ChevronDown className="h-4 w-4" />}
    </button>}
    <OrgTreeDropZones active={dragging && dragging !== node.id && (!assigningUnassigned || station)} targetId={node.id} onDrop={(mode) => onDrop(node.id, mode)} ar={ar} insideOnly={assigningUnassigned} />
  </div>;
}