import React from "react";
import { Building2, MapPin } from "lucide-react";
import HROrgEmployeeBranch from "@/components/hr/HROrgEmployeeBranch";

export default function HROrgStationBranch({ station, employees, ar, companyId, canManage }) {
  const employeeIds = new Set(employees.map((employee) => employee.id));
  const roots = employees.filter((employee) => !employeeIds.has(employee.profile?.directManagerId || employee.directManagerId));
  return (
    <section className="relative min-w-[280px] pt-8 before:absolute before:start-1/2 before:top-0 before:h-8 before:w-px before:bg-accent/60">
      <div className="mx-auto w-56 rounded-xl border border-accent/45 bg-primary p-3 text-center text-primary-foreground shadow-md">
        <Building2 className="mx-auto h-5 w-5 text-accent" />
        <h3 className="mt-1 truncate font-heading text-base font-semibold">{station.name}</h3>
        {station.location && <p className="mt-1 flex items-center justify-center gap-1 truncate text-[10px] text-primary-foreground/70"><MapPin className="h-3 w-3" />{station.location}</p>}
      </div>
      <div className="mx-auto h-7 w-px bg-accent/60" />
      {roots.length ? <div className="relative flex items-start justify-center gap-5 border-t border-accent/50 px-3 pt-7">{roots.map((employee) => <div key={employee.id} className="relative before:absolute before:-top-7 before:start-1/2 before:h-7 before:w-px before:bg-accent/45"><HROrgEmployeeBranch employee={employee} employees={employees} station={station} ar={ar} companyId={companyId} canManage={canManage} /></div>)}</div> : <p className="mx-auto w-44 rounded-lg border border-dashed bg-card p-3 text-center text-[10px] text-muted-foreground">{ar ? "لا يوجد موظفون" : "No employees"}</p>}
    </section>
  );
}