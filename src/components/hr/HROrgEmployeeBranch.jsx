import React from "react";
import HROrgEmployeeNode from "@/components/hr/HROrgEmployeeNode";

export default function HROrgEmployeeBranch({ employee, employees, station, ar, companyId, canManage }) {
  const children = employees.filter((item) => (item.profile?.directManagerId || item.directManagerId) === employee.id);
  return <div className="flex flex-col items-center">
    <HROrgEmployeeNode employee={employee} station={station} ar={ar} companyId={companyId} canManage={canManage} />
    {children.length > 0 && <><div className="h-6 w-px bg-accent/45" /><div className="flex items-start gap-4 border-t border-accent/45 px-3">{children.map((child) => <div key={child.id} className="relative pt-6 before:absolute before:start-1/2 before:top-0 before:h-6 before:w-px before:bg-accent/45"><HROrgEmployeeBranch employee={child} employees={employees} station={station} ar={ar} companyId={companyId} canManage={canManage} /></div>)}</div></>}
  </div>;
}