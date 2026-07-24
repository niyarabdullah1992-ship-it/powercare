import React from "react";
import { AlertTriangle } from "lucide-react";
import OrgTreeUnassignedEmployeeCard from "@/components/hr/OrgTreeUnassignedEmployeeCard";

export default function OrgTreeUnassignedEmployees({ employees, canManage, actions, ar }) {
  if (!employees.length) return null;
  return (
    <aside className="border-b border-amber-300 bg-amber-50/70 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/20">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400" /><div><p className="text-sm font-semibold">{ar ? "موظفون غير مخصصين" : "Unassigned employees"} <span className="text-muted-foreground">({employees.length})</span></p><p className="text-[10px] text-muted-foreground">{canManage ? (ar ? "اسحب الموظف وأسقطه داخل المحطة المناسبة" : "Drag an employee into the appropriate station") : (ar ? "غير مرتبطين بمحطة في الهيكل" : "Not linked to a station in the structure")}</p></div></div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">{employees.map((employee) => <OrgTreeUnassignedEmployeeCard key={employee.id} employee={employee} nodeId={`unassigned:${employee.id}`} canManage={canManage} actions={actions} ar={ar} />)}</div>
    </aside>
  );
}