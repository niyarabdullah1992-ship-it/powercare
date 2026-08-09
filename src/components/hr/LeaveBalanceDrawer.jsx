import React, { useState } from "react";
import { X, Check, Pencil } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { setLeaveTotal } from "@/lib/store";
import { LEAVE_TYPES, getLeaveTotal, usedLeaveDays, isLeaveTypeAllowed } from "@/lib/leaveTypes";

// Full per-employee breakdown of every leave type — opened from a balances row.
export default function LeaveBalanceDrawer({ employee, companyId, canEdit, onClose, ar }) {
  const { t } = useI18n();
  const types = LEAVE_TYPES.filter((ty) => ty.key !== "unpaid" && isLeaveTypeAllowed(employee.profile, ty.key));
  const editableTypes = types.filter((ty) => ty.defaultTotal !== null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const startEdit = () => {
    setForm(editableTypes.reduce((acc, ty) => ({ ...acc, [ty.key]: getLeaveTotal(employee.profile, ty.key) ?? 0 }), {}));
    setEditing(true);
  };

  const save = () => {
    editableTypes.forEach((ty) => setLeaveTotal(companyId, employee.id, ty.key, Number(form[ty.key]) || 0));
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/50" onClick={onClose}>
      <div className="h-full w-full max-w-sm overflow-y-auto border-s border-border bg-card p-5 pb-safe" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-lg font-semibold">{employee.name}</h3>
            <p className="text-xs text-muted-foreground font-body">{ar ? "تفصيل جميع أنواع الإجازات" : "All leave types"}</p>
          </div>
          <button onClick={onClose} className="rounded p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        {canEdit && (
          <button
            onClick={editing ? save : startEdit}
            className="mb-4 flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-body hover:bg-muted"
          >
            {editing ? <><Check className="h-3.5 w-3.5" />{ar ? "حفظ" : "Save"}</> : <><Pencil className="h-3.5 w-3.5" />{ar ? "تعديل الأرصدة" : "Edit balances"}</>}
          </button>
        )}

        <div className="space-y-2">
          {types.map((ty) => {
            const used = usedLeaveDays(employee.leaveRequests || [], ty.key);
            const total = getLeaveTotal(employee.profile, ty.key);
            return (
              <div key={ty.key} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
                <span className="text-sm font-body">{t(ty.key)}</span>
                {total === null ? (
                  <span className="text-xs text-muted-foreground font-body">{used ? `${used} ${t("days")}` : t("unlimited")}</span>
                ) : editing ? (
                  <input
                    type="number"
                    min="0"
                    value={form[ty.key]}
                    onChange={(e) => setForm({ ...form, [ty.key]: e.target.value })}
                    className="w-20 rounded-md border border-input px-2 py-1 text-sm font-body"
                  />
                ) : (
                  <span className="text-sm font-body">
                    {Math.max(0, total - used)}<span className="text-xs text-muted-foreground"> / {total}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}