import React from "react";
import { Crown, MapPinned, Users } from "lucide-react";
import EmployeeHierarchyNode from "@/components/directory/EmployeeHierarchyNode";

const roleOrder = { director: 0, ops_manager: 1, pgm: 2, station_manager: 3, safety_officer: 4, financial_officer: 5, inventory_keeper: 6, employee: 7 };

export default function EmployeeHierarchyTree({ sections, owner, company, t, ar, statusFor }) {
  return <div className="overflow-x-auto rounded-2xl border border-accent/20 bg-muted/40 p-4 pb-7 md:p-7">
    <div className="mx-auto min-w-max">
      <div className="mx-auto w-64 rounded-2xl border-2 border-accent bg-primary p-4 text-center text-primary-foreground shadow-elevated"><Crown className="mx-auto h-6 w-6 text-landing-gold-light" /><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70">{ar ? "المالك" : "Company owner"}</p><h2 className="mt-1 truncate font-heading text-lg font-semibold">{owner?.name || company?.name || (ar ? "مالك الشركة" : "Company owner")}</h2></div>
      <div className="mx-auto h-9 w-px bg-accent/60" />
      <div className="relative flex items-start justify-center gap-6 px-8 pt-9 before:absolute before:inset-x-[7rem] before:top-0 before:border-t-2 before:border-accent/40">
        {sections.map(({ station, employees }) => <section key={station.id} className="relative w-72 shrink-0 before:absolute before:-top-9 before:left-1/2 before:h-9 before:border-l-2 before:border-accent/40">
          <header className="relative rounded-2xl border border-accent/35 bg-card p-4 text-center shadow-soft"><span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-accent"><MapPinned className="h-5 w-5" /></span><h3 className="mt-2 truncate font-heading text-lg font-semibold">{station.name}</h3><p className="truncate text-[11px] text-muted-foreground">{station.location || (ar ? "الموقع غير محدد" : "Location not set")}</p><span className="mt-2 inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px]"><Users className="h-3 w-3 text-accent" />{employees.length} {ar ? "موظف" : "employees"}</span></header>
          <div className="mx-auto h-5 w-px bg-accent/40" />
          <div className="space-y-2 border-s-2 border-accent/25 ps-3">{employees.filter((employee) => employee.id !== owner?.id).sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9)).map((employee) => <div key={`${station.id}-${employee.id}`} className="relative before:absolute before:-start-3 before:top-1/2 before:w-3 before:border-t before:border-accent/30"><EmployeeHierarchyNode employee={employee} company={company} t={t} ar={ar} status={statusFor(employee.id)} /></div>)}{!employees.length && <p className="rounded-xl border border-dashed border-border bg-card p-4 text-center text-xs text-muted-foreground">{ar ? "لا يوجد موظفون" : "No employees"}</p>}</div>
        </section>)}
      </div>
    </div>
  </div>;
}