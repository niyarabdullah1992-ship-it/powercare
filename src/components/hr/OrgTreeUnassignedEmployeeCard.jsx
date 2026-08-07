import React from "react";
import { Link } from "react-router-dom";
import { GripVertical, UserRound } from "lucide-react";
import useOrgNodeDrag from "@/hooks/useOrgNodeDrag";

export default function OrgTreeUnassignedEmployeeCard({ employee, nodeId, canManage, actions, ar }) {
  const drag = useOrgNodeDrag(nodeId, canManage, actions.start, actions.end, actions.drop);
  return (
    <div {...drag.handlers} className={`flex min-w-40 select-none items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 shadow-sm ${canManage ? "cursor-grab active:cursor-grabbing" : ""}`}>
      {canManage && <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"><UserRound className="h-3.5 w-3.5" /></span>
      <span className="min-w-0 flex-1">
        <Link to={`/app/employees/${encodeURIComponent(employee.id)}`} onPointerDown={(event) => event.stopPropagation()} className="block truncate text-xs font-semibold hover:text-accent">{employee.name}</Link>
        <span className="block truncate text-[9px] leading-tight text-muted-foreground">{employee.profile?.position || employee.position || (ar ? "بدون مسمى" : "Untitled")}</span>
      </span>
    </div>
  );
}