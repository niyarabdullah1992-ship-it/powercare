import React from "react";
import { GripVertical, MapPinned, Users } from "lucide-react";
import EmployeeHierarchyNode from "@/components/directory/EmployeeHierarchyNode";

const roleOrder = { director: 0, ops_manager: 1, pgm: 2, station_manager: 3, safety_officer: 4, financial_officer: 5, inventory_keeper: 6, employee: 7 };

export default function StationHierarchyBranch({ station, employees, owner, company, t, ar, statusFor, onSelect, canReorder, dragProvided, dragging, clusterName }) {
  const team = employees.filter((employee) => employee.id !== owner?.id).sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9));
  return <section ref={dragProvided.innerRef} {...dragProvided.draggableProps} className={`relative w-72 shrink-0 before:absolute before:-top-9 before:left-1/2 before:h-9 before:border-l-2 before:border-accent/40 ${dragging ? "z-20" : ""}`}>
    <button type="button" onClick={() => onSelect?.(station.id)} className="relative w-full rounded-2xl border border-accent/35 bg-card p-4 text-center shadow-soft hover:border-accent hover:shadow-elevated">
      <span {...dragProvided.dragHandleProps} onClick={(event) => event.stopPropagation()} className={`absolute start-3 top-3 text-muted-foreground ${canReorder ? "cursor-grab" : "hidden"}`}><GripVertical className="h-4 w-4" /></span>
      {clusterName && <p className="mb-2 truncate text-[9px] font-semibold uppercase tracking-widest text-accent">{clusterName}</p>}<span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-accent"><MapPinned className="h-5 w-5" /></span><h3 className="mt-2 truncate font-heading text-lg font-semibold">{station.name}</h3><p className="truncate text-[11px] text-muted-foreground">{station.location || (ar ? "الموقع غير محدد" : "Location not set")}</p><span className="mt-2 inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px]"><Users className="h-3 w-3 text-accent" />{team.length} {ar ? "موظف" : "employees"}</span>
    </button>
    <div className="mx-auto h-5 w-px bg-accent/40" /><div className="space-y-2 border-s-2 border-accent/25 ps-3">{team.map((employee) => <div key={`${station.id}-${employee.id}`} className="relative before:absolute before:-start-3 before:top-1/2 before:w-3 before:border-t before:border-accent/30"><EmployeeHierarchyNode employee={employee} company={company} t={t} ar={ar} status={statusFor(employee.id)} /></div>)}{!team.length && <p className="rounded-xl border border-dashed border-border bg-card p-4 text-center text-xs text-muted-foreground">{ar ? "لا يوجد موظفون" : "No employees"}</p>}</div>
  </section>;
}