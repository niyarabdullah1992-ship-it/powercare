import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateEmployeeProfile } from "@/lib/store";
import { Pencil, Check } from "lucide-react";

export default function SalaryTab({ employee, companyId, canEdit }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const profile = employee.profile || {};
  const [form, setForm] = useState({
    baseSalary: profile.baseSalary || "",
    allowances: profile.allowances || "",
    currency: profile.currency || "SAR",
  });

  const save = () => {
    updateEmployeeProfile(companyId, employee.id, form);
    setEditing(false);
  };

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold">{t("salary")}</h3>
        {canEdit && (
          editing ? (
            <button onClick={save} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body">
              <Check className="w-3.5 h-3.5" /> {t("save")}
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
              <Pencil className="w-3.5 h-3.5" /> {t("edit")}
            </button>
          )
        )}
      </div>
      {!canEdit && !profile.baseSalary ? (
        <p className="text-sm text-muted-foreground font-body">—</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[["baseSalary", "baseSalary"], ["allowances", "allowances"], ["currency", "currency"]].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs text-muted-foreground font-body mb-1">{t(label)}</label>
              {editing ? (
                <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
              ) : (
                <p className="text-sm font-body">{profile[key] || "—"}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}