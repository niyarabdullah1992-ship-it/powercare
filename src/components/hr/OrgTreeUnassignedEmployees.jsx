import React from "react";
import { AlertTriangle } from "lucide-react";
import OrgTreeUnassignedEmployeeCard from "@/components/hr/OrgTreeUnassignedEmployeeCard";

export default function OrgTreeUnassignedEmployees({ employees, canManage, actions, ar }) {
  if (!employees.length) return null;
  return (
    <aside className="border-b border-amber-300 bg-amber-50/70 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/20">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" /><div><p className="text-xs font-semibold">{ar ? "موظفون غير مخصصين" : "Unassigned employees"} <span className="text-muted-foreground">({employees.length})</span></p><p className="text-[9px] leading-tight text-muted-foreground">{canManage ? (ar ? "اسحب الموظف إلى المحطة" : "Drag into a station") : (ar ? "غير مرتبطين بمحطة" : "Not linked to a station")}</p></div></div>
      </div>
      <div className="flex gap-2 overflow-x-auto">{employees.map((employee) => <OrgTreeUnassignedEmployeeCard key={employee.id} employee={employee} nodeId={`unassigned:${employee.id}`} canManage={canManage} actions={actions} ar={ar} />)}</div>
    </aside>
  );
}