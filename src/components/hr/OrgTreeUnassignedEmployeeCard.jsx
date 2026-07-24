import React from "react";
import { Link } from "react-router-dom";
import { GripVertical, UserRound } from "lucide-react";
import useOrgNodeDrag from "@/hooks/useOrgNodeDrag";

export default function OrgTreeUnassignedEmployeeCard({ employee, nodeId, canManage, actions, ar }) {
  const drag = useOrgNodeDrag(nodeId, canManage, actions.start, actions.end, actions.drop);
  return (
    <div {...drag.handlers} className={`flex min-w-52 select-none items-center gap-2.5 rounded-lg border border-border bg-card p-3 shadow-sm ${canManage ? "cursor-grab active:cursor-grabbing" : ""}`}>
      {canManage && <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />}
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"><UserRound className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1">
        <Link to={`/app/employees/${encodeURIComponent(employee.id)}`} onPointerDown={(event) => event.stopPropagation()} className="block truncate text-sm font-semibold hover:text-accent">{employee.name}</Link>
        <span className="block truncate text-[10px] text-muted-foreground">{employee.profile?.position || employee.position || (ar ? "بدون مسمى" : "Untitled")}</span>
      </span>
    </div>
  );
}