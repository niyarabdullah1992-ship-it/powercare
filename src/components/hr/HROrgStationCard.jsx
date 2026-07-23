import React from "react";
import { Link } from "react-router-dom";
import { Building2, MapPin } from "lucide-react";
import HROrgEmployeeNode from "@/components/hr/HROrgEmployeeNode";

const roleOrder = { director: 0, ops_manager: 1, pgm: 2, station_manager: 3, safety_officer: 4, financial_officer: 5, inventory_keeper: 6, employee: 7 };

export default function HROrgStationCard({ station, employees, ar }) {
  const ordered = [...employees].sort((a, b) => (roleOrder[a.role] ?? 20) - (roleOrder[b.role] ?? 20));
  return <section data-org-node onClick={(event) => event.stopPropagation()} className="w-60 rounded-xl border border-accent/35 bg-card p-3 shadow-sm">
    <Link to={`/app/hr/stations/${station.id}`} className="block rounded-lg p-1 text-center hover:bg-muted/60"><span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary text-accent"><Building2 className="h-4 w-4" /></span><h4 className="mt-2 truncate font-heading text-base font-semibold">{station.name}</h4>{station.location && <p className="mt-0.5 flex items-center justify-center gap-1 truncate text-[10px] text-muted-foreground"><MapPin className="h-3 w-3" />{station.location}</p>}</Link>
    <div className="mt-3 space-y-1.5 border-t border-accent/20 pt-2.5">{ordered.length ? ordered.map((employee) => <HROrgEmployeeNode key={employee.id} employee={employee} station={station} ar={ar} compact />) : <p className="py-2 text-center text-[10px] text-muted-foreground">{ar ? "لا يوجد موظفون" : "No employees"}</p>}</div>
  </section>;
}