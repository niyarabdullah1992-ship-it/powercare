import React from "react";
import { Link } from "react-router-dom";

const STATUS_STYLE = {
  active: "bg-accent/10 text-accent-text border-accent/25",
  leave: "bg-muted text-muted-foreground border-border",
  notice: "bg-amber-50 text-amber-700 border-amber-200",
};

// جدول دليل الموظفين — صف لكل موظف مع رقمه الوظيفي وقسمه وفرعه وحالته.
export default function EmployeeDirectoryTable({ rows, ar }) {
  if (rows.length === 0) {
    return <p className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">{ar ? "لا يوجد موظفون مطابقون للفلاتر" : "No employees match the filters"}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm mobile-cards">
        <thead>
          <tr>
            <th className="px-4 py-3 text-start font-medium">{ar ? "الموظف" : "Employee"}</th>
            <th className="px-4 py-3 text-start font-medium">{ar ? "الرقم الوظيفي" : "Job number"}</th>
            <th className="px-4 py-3 text-start font-medium">{ar ? "القسم" : "Department"}</th>
            <th className="px-4 py-3 text-start font-medium">{ar ? "المسمى الوظيفي" : "Job title"}</th>
            <th className="px-4 py-3 text-start font-medium">{ar ? "الفرع" : "Branch"}</th>
            <th className="px-4 py-3 text-start font-medium">{ar ? "الحالة" : "Status"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border/60">
              <td data-label={ar ? "الموظف" : "Employee"} className="px-4 py-3">
                <Link to={`/app/employees/${row.id}`} className="flex items-center gap-2 hover:text-accent-text">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {row.avatarUrl ? <img src={row.avatarUrl} alt={row.name} className="h-full w-full object-cover" /> : (row.name?.charAt(0) || "?")}
                  </span>
                  <span className="truncate font-medium">{row.name}</span>
                </Link>
              </td>
              <td data-label={ar ? "الرقم الوظيفي" : "Job number"} className="px-4 py-3 text-muted-foreground" dir="ltr">{row.jobNumber || "—"}</td>
              <td data-label={ar ? "القسم" : "Department"} className="px-4 py-3 text-muted-foreground">{row.department || "—"}</td>
              <td data-label={ar ? "المسمى الوظيفي" : "Job title"} className="px-4 py-3 text-muted-foreground">{row.position || "—"}</td>
              <td data-label={ar ? "الفرع" : "Branch"} className="px-4 py-3 text-muted-foreground">{row.branch || "—"}</td>
              <td data-label={ar ? "الحالة" : "Status"} className="px-4 py-3">
                <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLE[row.statusKey]}`}>{row.statusLabel}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}