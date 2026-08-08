import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LEAVE_TYPES, getLeaveTotal, usedLeaveDays } from "@/lib/leaveTypes";

// Company-wide leave balances: one row per employee, one column per leave type.
export default function LeaveBalancesTable({ employees, ar }) {
  const { t } = useI18n();
  const types = LEAVE_TYPES.filter((ty) => ty.key !== "unpaid" && ty.defaultTotal !== null);

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
        <CalendarDays className="h-4 w-4 text-accent" /> {ar ? "أرصدة الإجازات" : "Leave balances"}
      </h2>
      {employees.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{ar ? "لا يوجد موظفون." : "No employees."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full mobile-cards">
            <thead>
              <tr>
                <th className="p-2 text-start">{ar ? "الموظف" : "Employee"}</th>
                {types.map((ty) => <th key={ty.key} className="p-2 text-start">{t(ty.key)}</th>)}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-border">
                  <td className="p-2" data-label={ar ? "الموظف" : "Employee"}>
                    <Link to={`/app/employees/${emp.id}`} className="text-accent hover:underline">{emp.name}</Link>
                  </td>
                  {types.map((ty) => {
                    const total = getLeaveTotal(emp.profile, ty.key) ?? 0;
                    const remaining = Math.max(0, total - usedLeaveDays(emp.leaveRequests || [], ty.key));
                    return (
                      <td key={ty.key} className="p-2 font-body" data-label={t(ty.key)}>
                        {remaining}<span className="text-xs text-muted-foreground"> / {total}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}