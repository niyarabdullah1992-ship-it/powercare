import React from "react";
import { AlertTriangle } from "lucide-react";
import OrgTreeUnassignedEmployeeCard from "@/components/hr/OrgTreeUnassignedEmployeeCard";

export default function HROrgUnassigned({ employees, canManage, dropActive, actions, ar }) {
  if (!employees.length && !dropActive) return null;
  return <aside data-org-drop={dropActive ? "true" : undefined} data-target-id="unassigned" data-drop-mode="unassign" className={`border-t px-3 py-3 ${dropActive ? "border-accent bg-accent/15 ring-2 ring-inset ring-accent" : "border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/20"}`}>
    <div className="mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-700" /><div><p className="text-xs font-semibold">{ar ? "موظفو HR غير مسندين" : "Unassigned HR employees"} ({employees.length})</p><p className="text-[9px] text-muted-foreground">{dropActive ? (ar ? "أفلت هنا لإلغاء الإسناد" : "Drop here to unassign") : (ar ? "اسحب الموظف إلى محطة أو مجموعة أو مدير" : "Drag an employee to a station, cluster, or manager")}</p></div></div>
    <div className="flex gap-2 overflow-x-auto">{employees.map((employee) => <OrgTreeUnassignedEmployeeCard key={employee.id} employee={employee} nodeId={`unassigned:${employee.id}`} canManage={canManage} actions={actions} ar={ar} />)}</div>
  </aside>;
}