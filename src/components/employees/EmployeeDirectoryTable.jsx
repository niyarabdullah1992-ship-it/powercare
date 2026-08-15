import React from "react";
import { useNavigate } from "react-router-dom";
import { expiringDocs, isOnDuty, isProbation } from "@/lib/employeeStatus";
import { useAuth } from "@/lib/PowerCareAuth";
import { employeeOrgSeat } from "@/lib/orgPositions";
import { jobGradeLabel } from "@/lib/jobGrades";
import { trackLabel } from "@/lib/orgTracks";

export default function EmployeeDirectoryTable({ employees, stationName, managerName, gradeLabel, ar }) {
  const navigate = useNavigate();
  const { data } = useAuth();

  if (!employees.length) {
    return <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground font-body">{ar ? "لا يوجد موظفون مطابقون." : "No matching employees."}</p>;
  }

  const headers = ar
    ? ["الموظف", "المقعد والدرجة", "الوحدة والمقر", "المدير", "الحالة", ""]
    : ["Employee", "Seat & grade", "Unit & site", "Manager", "Status", ""];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="mobile-cards w-full text-start">
        <thead>
          <tr>{headers.map((h, i) => <th key={i} className="px-3 py-2 text-start font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {employees.map((employee) => {
            const org = employeeOrgSeat(employee, data);
            const seat = [org.title, trackLabel(org.track, ar), jobGradeLabel(org.grade) || gradeLabel?.(employee)].filter(Boolean).join(" · ");
            const docs = expiringDocs(employee);
            const dept = employee.profile?.department;
            return (
              <tr
                key={employee.id}
                onClick={() => navigate(`/app/employees/${encodeURIComponent(employee.id)}`)}
                className="cursor-pointer border-t border-border"
                title={employee.email || ""}
              >
                <td data-label={headers[0]} className="px-3 py-2">
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-xs font-semibold text-accent-text">
                      {employee.profile?.avatarUrl ? <img src={employee.profile.avatarUrl} alt={employee.name} className="h-full w-full object-cover" /> : (employee.name || "?").charAt(0)}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium leading-tight">{employee.name}</span>
                      {employee.profile?.nationalId && (
                        <span className="block text-[11px] text-muted-foreground" dir="ltr">{employee.profile.nationalId}</span>
                      )}
                    </span>
                  </span>
                </td>
                <td data-label={headers[1]} className="px-3 py-2">
                  {seat ? (
                    <span className="text-foreground">{seat}</span>
                  ) : (
                    <span className="font-medium text-destructive">{ar ? "بلا مقعد — تعيين" : "No seat — assign"}</span>
                  )}
                </td>
                <td data-label={headers[2]} className="px-3 py-2 text-muted-foreground">
                  {[dept, stationName(employee.stationId)].filter((v) => v && v !== "—").join(" · ") || (
                    <span className="text-destructive">{ar ? "بلا وحدة" : "Unassigned"}</span>
                  )}
                </td>
                <td data-label={headers[3]} className="px-3 py-2 text-muted-foreground">
                  {managerName(employee) || <span className="text-destructive">{ar ? "بلا مدير" : "No manager"}</span>}
                </td>
                <td data-label={headers[4]} className="px-3 py-2 text-muted-foreground">
                  {!isOnDuty(employee) ? (ar ? "في إجازة" : "On leave") : isProbation(employee) ? (ar ? "تحت التجربة" : "Probation") : (ar ? "على رأس العمل" : "On duty")}
                </td>
                <td data-label="" className="px-3 py-2">
                  {docs.length > 0 && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full bg-destructive"
                      title={ar ? `${docs.length} مستند ينتهي قريباً` : `${docs.length} document(s) expiring soon`}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}