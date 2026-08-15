import React, { useMemo, useState } from "react";
import { CARD, MUTED, NAVY, NAVY_FILL, field, textarea } from "@/lib/platformStyles";
import { taskAssigneeId } from "@/lib/opsDerivations";

/**
 * Manager-only توكيل — pick another employee in station scope and record why.
 */
export default function OpsReassignModal({
  task,
  ar,
  employees = [],
  busy,
  onClose,
  onConfirm,
}) {
  const currentId = String(taskAssigneeId(task) || "");
  const options = useMemo(
    () => (employees || []).filter((emp) => {
      const id = String(emp.employeeId || emp.id || "");
      return id && id !== currentId;
    }),
    [employees, currentId],
  );
  const [toId, setToId] = useState(options[0] ? String(options[0].employeeId || options[0].id) : "");
  const [reason, setReason] = useState("");

  if (!task) return null;

  const canSubmit = !!toId && reason.trim().length > 0 && !busy;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      dir={ar ? "rtl" : "ltr"}
    >
      <div
        className="w-full max-w-md rounded-xl p-4 shadow-lg"
        style={{ background: CARD }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-semibold" style={{ color: NAVY }}>
          {ar ? "توكيل المهمة" : "Delegate task"}
        </div>
        <p className="mt-1 text-[11px] leading-6" style={{ color: MUTED }}>
          {ar
            ? "يُعاد إسناد الإثبات لموظف آخر في نفس نطاق الفرع. المسؤول السابق يبقى في سجل التدقيق."
            : "Proof duty moves to another employee in the same station scope. The previous assignee stays on the audit trail."}
        </p>

        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold" style={{ color: MUTED }}>
            {ar ? "الموكَّل إليه" : "Delegate to"}
          </span>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            style={field}
          >
            <option value="">{ar ? "اختر موظفًا" : "Select employee"}</option>
            {options.map((emp) => {
              const id = emp.employeeId || emp.id;
              return (
                <option key={id} value={id}>{emp.name}</option>
              );
            })}
          </select>
        </label>

        {options.length === 0 && (
          <div className="mt-2 text-[11px] leading-6" style={{ color: "#B45309" }}>
            {ar
              ? "لا موظف آخر ظاهر في نطاق هذا الفرع."
              : "No other visible employee in this station scope."}
          </div>
        )}

        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold" style={{ color: MUTED }}>
            {ar ? "لماذا لم تُنجز / سبب التوكيل" : "Why it was not done / reason"}
          </span>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={ar ? "سبب التوكيل (مطلوب)" : "Delegation reason (required)"}
            style={textarea}
          />
        </label>

        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs"
            style={{ color: MUTED, background: CARD }}
          >
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onConfirm?.({ toId, reason: reason.trim() })}
            className="rounded-lg px-3 py-1.5 text-xs text-white disabled:opacity-50"
            style={{ background: NAVY_FILL }}
          >
            {ar ? "توكيل" : "Delegate"}
          </button>
        </div>
      </div>
    </div>
  );
}
