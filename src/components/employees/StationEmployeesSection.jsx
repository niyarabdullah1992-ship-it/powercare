import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Users } from "lucide-react";

// بيانات موظفي محطة/فرع واحد داخل قسم قابل للطي.
export default function StationEmployeesSection({ stationName, employees, ar }) {
  const [open, setOpen] = useState(true);
  const headers = ar
    ? ["الموظف", "الرقم الوظيفي", "المسمى الوظيفي", "الجوال", "البريد", "تاريخ التعيين"]
    : ["Employee", "Job number", "Position", "Mobile", "Email", "Hire date"];

  return (
    <section className="rounded-xl border border-border bg-card">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start">
        <span className="flex items-center gap-2.5 min-w-0">
          <Users className="h-4 w-4 shrink-0 text-accent" />
          <span className="truncate font-heading text-sm font-semibold">{stationName}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{employees.length}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="overflow-x-auto border-t border-border p-4">
          {employees.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{ar ? "لا يوجد موظفون" : "No employees"}</p>
          ) : (
            <table className="w-full min-w-[720px] mobile-cards">
              <thead>
                <tr>{headers.map((h) => <th key={h} className="px-2 pb-3 text-start text-[11px] font-semibold text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody>
                {employees.map((employee) => {
                  const profile = employee.profile || {};
                  const cells = [
                    profile.jobNumber || "—",
                    profile.position || "—",
                    employee.phone || "—",
                    employee.email || "—",
                    profile.hireDate || "—",
                  ];
                  return (
                    <tr key={employee.id} className="border-t border-border/60">
                      <td data-label={headers[0]} className="px-2 py-2.5 text-sm">
                        <Link to={`/app/employees/${employee.id}`} className="font-medium hover:text-accent">{employee.name}</Link>
                      </td>
                      {cells.map((value, index) => (
                        <td key={index} data-label={headers[index + 1]} className="px-2 py-2.5 text-sm text-muted-foreground" dir={index === 2 || index === 3 ? "ltr" : undefined}>{value}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}