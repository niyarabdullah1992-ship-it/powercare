import React from "react";
import { MapPinned, Users } from "lucide-react";
import EmployeeDirectoryCard from "@/components/directory/EmployeeDirectoryCard";

export default function StationDirectorySection({ station, employees, cardProps, statusFor, ar }) {
  return <section className="overflow-hidden rounded-lg border border-border bg-background">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-4"><div><h2 className="font-heading text-xl font-semibold">{station.name}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPinned className="h-3.5 w-3.5" />{station.location || (ar ? "الموقع غير محدد" : "Location not set")}</p></div><span className="flex items-center gap-2 rounded-sm bg-muted px-3 py-1.5 text-xs font-semibold"><Users className="h-4 w-4 text-accent" />{employees.length} {ar ? "موظف" : "employees"}</span></header>
    <div className="grid gap-4 bg-muted/50 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{employees.map((employee) => <EmployeeDirectoryCard key={`${station.id}-${employee.id}`} employee={employee} station={station} taskStatus={statusFor(employee.id)} {...cardProps} />)}{!employees.length && <p className="col-span-full py-8 text-center text-xs text-muted-foreground">{ar ? "لا يوجد موظفون في هذه المحطة." : "No employees at this station."}</p>}</div>
  </section>;
}