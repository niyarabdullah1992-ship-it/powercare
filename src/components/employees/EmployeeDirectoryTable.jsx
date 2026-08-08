import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function EmployeeDirectoryTable({ employees, stationName, roleLabel, ar, dir }) {
  const navigate = useNavigate();
  const Arrow = dir === "rtl" ? ChevronLeft : ChevronRight;

  if (!employees.length) {
    return <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground font-body">{ar ? "لا يوجد موظفون مطابقون." : "No matching employees."}</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="mobile-cards w-full text-start">
        <thead>
          <tr>
            {[ar ? "الموظف" : "Employee", ar ? "المسمى الوظيفي" : "Position", ar ? "الدور" : "Role", ar ? "المحطة" : "Station", ar ? "التواصل" : "Contact", ""].map((h, i) => (
              <th key={i} className="px-4 py-3 text-start font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr
              key={employee.id}
              onClick={() => navigate(`/app/employees/${encodeURIComponent(employee.id)}`)}
              className="cursor-pointer border-t border-border"
            >
              <td data-label={ar ? "الموظف" : "Employee"} className="px-4 py-3">
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-xs font-semibold text-accent-text">
                    {employee.profile?.avatarUrl ? <img src={employee.profile.avatarUrl} alt={employee.name} className="h-full w-full object-cover" /> : (employee.name || "?").charAt(0)}
                  </span>
                  <span className="min-w-0 font-medium">{employee.name}</span>
                </span>
              </td>
              <td data-label={ar ? "المسمى الوظيفي" : "Position"} className="px-4 py-3 text-muted-foreground">{employee.profile?.position || employee.position || "—"}</td>
              <td data-label={ar ? "الدور" : "Role"} className="px-4 py-3">
                <span className="inline-flex rounded-full border border-accent/35 bg-accent/10 px-2.5 py-1 text-[11px] text-accent-text">{roleLabel(employee.role)}</span>
              </td>
              <td data-label={ar ? "المحطة" : "Station"} className="px-4 py-3 text-muted-foreground">{stationName(employee.stationId)}</td>
              <td data-label={ar ? "التواصل" : "Contact"} className="px-4 py-3 text-muted-foreground">{employee.email || employee.phone || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground"><Arrow className="h-4 w-4" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}