import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { LEAVE_TYPES, getLeaveTotal, usedLeaveDays } from "@/lib/leaveTypes";
import LeavePolicyCard from "@/components/hr/LeavePolicyCard";
import LeaveBalanceDrawer from "@/components/hr/LeaveBalanceDrawer";

// Only what actually differs per employee: annual usage, sick days taken,
// documented exceptions to the company policy, and the latest request.
export default function LeaveBalancesTable({ employees, companyId, canEdit, ar }) {
  const { t } = useI18n();
  const [openEmployee, setOpenEmployee] = useState(null);

  const exceptionsOf = (emp) =>
    LEAVE_TYPES.filter((ty) => ty.defaultTotal !== null && emp.profile?.leaveTotals?.[ty.key] != null && emp.profile.leaveTotals[ty.key] !== ty.defaultTotal)
      .map((ty) => `${t(ty.key)} ${emp.profile.leaveTotals[ty.key]}`);

  const lastRequestOf = (emp) =>
    [...(emp.leaveRequests || [])].sort((a, b) => String(b.startDate || "").localeCompare(String(a.startDate || "")))[0];

  const headers = ar
    ? ["الموظف", "السنوية", "المرضية", "استثناءات", "آخر طلب"]
    : ["Employee", "Annual", "Sick", "Exceptions", "Last request"];

  return (
    <div className="space-y-4">
      <LeavePolicyCard ar={ar} />

      {employees.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground font-body">{ar ? "لا يوجد موظفون." : "No employees."}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="mobile-cards w-full">
            <thead>
              <tr>{headers.map((h) => <th key={h} className="px-3 py-2 text-start font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const total = getLeaveTotal(emp.profile, "annual") ?? 0;
                const used = usedLeaveDays(emp.leaveRequests || [], "annual");
                const remaining = Math.max(0, total - used);
                const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                const low = total > 0 && remaining <= 3;
                const sick = usedLeaveDays(emp.leaveRequests || [], "sick");
                const exceptions = exceptionsOf(emp);
                const last = lastRequestOf(emp);
                return (
                  <tr key={emp.id} onClick={() => setOpenEmployee(emp)} className="cursor-pointer border-t border-border">
                    <td className="px-3 py-2 font-medium" data-label={headers[0]}>{emp.name}</td>
                    <td className="px-3 py-2" data-label={headers[1]}>
                      <span className="block w-full min-w-[110px] max-w-[180px]">
                        <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                          <span className={`block h-full rounded-full ${low ? "bg-destructive" : "bg-accent"}`} style={{ width: `${pct}%` }} />
                        </span>
                        <span className={`mt-1 block text-[11px] font-body ${low ? "text-destructive" : "text-muted-foreground"}`}>
                          {ar ? `مستهلك ${used} من ${total} · متبقٍ ${remaining}` : `${used} of ${total} used · ${remaining} left`}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground" data-label={headers[2]}>
                      {sick ? `${sick} ${t("days")}` : "—"}
                    </td>
                    <td className="px-3 py-2" data-label={headers[3]}>
                      {exceptions.length ? (
                        <span className="inline-flex rounded-full border border-accent/35 bg-accent/10 px-2 py-0.5 text-[11px] text-accent-text">{exceptions.join(" · ")}</span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground" data-label={headers[4]}>
                      {last ? `${t(last.type)} · ${String(last.startDate || "").slice(0, 10)}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {openEmployee && (
        <LeaveBalanceDrawer
          employee={openEmployee}
          companyId={companyId}
          canEdit={canEdit}
          ar={ar}
          onClose={() => setOpenEmployee(null)}
        />
      )}
    </div>
  );
}