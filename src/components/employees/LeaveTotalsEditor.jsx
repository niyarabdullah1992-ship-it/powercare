import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { setLeaveTotal } from "@/lib/store";
import { LEAVE_TYPES, getLeaveTotal } from "@/lib/leaveTypes";
import { Pencil, Check } from "lucide-react";

export default function LeaveTotalsEditor({ employee, companyId }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const profile = employee.profile || {};
  const types = LEAVE_TYPES.filter((ty) => ty.key !== "unpaid");
  const [form, setForm] = useState(() => types.reduce((acc, ty) => ({ ...acc, [ty.key]: getLeaveTotal(profile, ty.key) ?? 0 }), {}));

  const save = () => {
    types.forEach((ty) => setLeaveTotal(companyId, employee.id, ty.key, form[ty.key]));
    setEditing(false);
  };

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold">{t("adjustLeaveTotals")}</h3>
        {editing ? (
          <button onClick={save} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body">
            <Check className="w-3.5 h-3.5" /> {t("save")}
          </button>
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
            <Pencil className="w-3.5 h-3.5" /> {t("edit")}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {types.map((ty) => (
          <div key={ty.key}>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t(ty.key)}</label>
            {editing ? (
              <input type="number" min="0" value={form[ty.key]} onChange={(e) => setForm({ ...form, [ty.key]: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded-md border border-input text-sm font-body" />
            ) : (
              <p className="text-sm font-body">{getLeaveTotal(profile, ty.key)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}