import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserCircle } from "lucide-react";
import { getRoleLabel } from "@/lib/roles";
import { matchesEmployeeSearch } from "@/lib/employeeSearch";

export default function EmployeeGlobalSearch({ employees, stations, company, t }) {
  const [query, setQuery] = useState("");
  const roleLabel = (role) => getRoleLabel(company, role, t);
  const matches = query.trim() ? employees.filter((employee) => matchesEmployeeSearch(employee, query, stations, roleLabel)) : [];
  const stationName = (employee) => stations.find((station) => station.id === employee.stationId)?.name || "—";

  return <div className="rounded-xl border border-border bg-card p-4 space-y-3">
    <div className="relative">
      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`${t("search")} — ${t("employees")}`} className="w-full rounded-md border border-input py-2.5 pe-3 ps-9 text-sm font-body" />
    </div>
    {query.trim() && <div className="divide-y divide-border rounded-lg border border-border">
      {matches.map((employee) => <Link key={employee.id} to={`/app/employees/${employee.id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-muted">
        <UserCircle className="h-5 w-5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{employee.name}</p><p className="truncate text-xs text-muted-foreground">{employee.email || "—"} · {roleLabel(employee.role)} · {stationName(employee)}</p></div>
      </Link>)}
      {!matches.length && <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t("noResults")}</p>}
    </div>}
  </div>;
}