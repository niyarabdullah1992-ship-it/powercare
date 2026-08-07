import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, IdCard, Mail, Phone } from "lucide-react";

// قائمة موظفي المحطة المختارة — كل بطاقة تفتح ملف الموظف.
export default function StationEmployeeCards({ employees, ar }) {
  if (employees.length === 0) {
    return <p className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">{ar ? "لا يوجد موظفون في هذا الفرع" : "No employees in this branch"}</p>;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {employees.map((employee) => {
        const profile = employee.profile || {};
        return (
          <Link key={employee.id} to={`/app/employees/${employee.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-accent/60">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt={employee.name} className="h-full w-full object-cover" /> : (employee.name?.charAt(0) || "?")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{employee.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{profile.position || (ar ? "موظف" : "Employee")}</span>
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {profile.jobNumber && <span className="flex items-center gap-1"><IdCard className="h-3 w-3" /><span dir="ltr">{profile.jobNumber}</span></span>}
                {employee.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /><span dir="ltr">{employee.phone}</span></span>}
                {employee.email && <span className="flex min-w-0 items-center gap-1"><Mail className="h-3 w-3 shrink-0" /><span dir="ltr" className="truncate">{employee.email}</span></span>}
              </span>
            </span>
            <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-0 ltr:rotate-180" />
          </Link>
        );
      })}
    </div>
  );
}