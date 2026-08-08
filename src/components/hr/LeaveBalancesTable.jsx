import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Pencil, Check, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { setLeaveTotal } from "@/lib/store";
import { LEAVE_TYPES, getLeaveTotal, usedLeaveDays } from "@/lib/leaveTypes";

// Company-wide leave balances: one row per employee, one column per leave type.
// Managers / HR can edit each employee's yearly totals inline.
export default function LeaveBalancesTable({ employees, companyId, canEdit, ar }) {
  const { t } = useI18n();
  const types = LEAVE_TYPES.filter((ty) => ty.key !== "unpaid" && ty.defaultTotal !== null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});

  const startEdit = (emp) => {
    setEditingId(emp.id);
    setForm(types.reduce((acc, ty) => ({ ...acc, [ty.key]: getLeaveTotal(emp.profile, ty.key) ?? 0 }), {}));
  };

  const save = (emp) => {
    types.forEach((ty) => setLeaveTotal(companyId, emp.id, ty.key, Number(form[ty.key]) || 0));
    setEditingId(null);
  };

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
        <CalendarDays className="h-4 w-4 text-accent" /> {ar ? "أرصدة الإجازات" : "Leave balances"}
      </h2>
      {canEdit && (
        <p className="text-xs text-muted-foreground font-body">
          {ar ? "يمكن للمدراء والموارد البشرية تعديل الرصيد السنوي لكل موظف." : "Managers and HR can edit each employee's yearly balance."}
        </p>
      )}
      {employees.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{ar ? "لا يوجد موظفون." : "No employees."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full mobile-cards">
            <thead>
              <tr>
                <th className="p-2 text-start">{ar ? "الموظف" : "Employee"}</th>
                {types.map((ty) => <th key={ty.key} className="p-2 text-start">{t(ty.key)}</th>)}
                {canEdit && <th className="p-2" />}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const editing = editingId === emp.id;
                return (
                  <tr key={emp.id} className="border-b border-border">
                    <td className="p-2" data-label={ar ? "الموظف" : "Employee"}>
                      <Link to={`/app/employees/${emp.id}`} className="text-accent hover:underline">{emp.name}</Link>
                    </td>
                    {types.map((ty) => {
                      const total = getLeaveTotal(emp.profile, ty.key) ?? 0;
                      const remaining = Math.max(0, total - usedLeaveDays(emp.leaveRequests || [], ty.key));
                      return (
                        <td key={ty.key} className="p-2 font-body" data-label={t(ty.key)}>
                          {editing ? (
                            <input
                              type="number"
                              min="0"
                              value={form[ty.key]}
                              onChange={(e) => setForm({ ...form, [ty.key]: e.target.value })}
                              className="w-20 rounded-md border border-input px-2 py-1 text-sm font-body"
                            />
                          ) : (
                            <>{remaining}<span className="text-xs text-muted-foreground"> / {total}</span></>
                          )}
                        </td>
                      );
                    })}
                    {canEdit && (
                      <td className="p-2" data-label="">
                        {editing ? (
                          <div className="flex gap-1">
                            <button onClick={() => save(emp)} className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setEditingId(null)} className="rounded p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(emp)} className="rounded p-1.5 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}