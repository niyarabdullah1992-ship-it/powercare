import React from "react";
import { EMPLOYEE_FILTERS } from "@/lib/employeeStatus";

export default function EmployeeStatusFilters({ employees, active, onChange, ar }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {EMPLOYEE_FILTERS.map((f) => {
        const count = employees.filter(f.match).length;
        const on = active === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(on ? null : f.key)}
            className={`rounded-lg border px-3 py-2 text-start transition-colors ${on ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-muted"}`}
          >
            <span className={`block text-xl font-semibold leading-none ${f.alert && count > 0 ? "text-destructive" : "text-foreground"}`}>{count}</span>
            <span className="mt-1 block text-[11px] leading-tight text-muted-foreground font-body">
              {ar ? (f.shortAr || f.ar) : (f.shortEn || f.en)}
            </span>
          </button>
        );
      })}
    </div>
  );
}