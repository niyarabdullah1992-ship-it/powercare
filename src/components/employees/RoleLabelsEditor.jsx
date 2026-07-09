import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateCompany } from "@/lib/store";
import { SYSTEM_ROLES } from "@/lib/roles";
import { Pencil, Check, X } from "lucide-react";

export default function RoleLabelsEditor({ company }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [labels, setLabels] = useState(() =>
    Object.fromEntries(SYSTEM_ROLES.map((r) => [r, company.roleLabels?.[r] || ""]))
  );

  const save = () => {
    updateCompany(company.id, (d) => {
      d.roleLabels = { ...(d.roleLabels || {}), ...labels };
    });
    setEditing(false);
  };

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
        <Pencil className="w-3.5 h-3.5" /> {t("editRoleLabels")}
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("editRoleLabels")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SYSTEM_ROLES.map((r) => (
          <div key={r}>
            <label className="text-xs text-muted-foreground font-body block mb-1">{t(r)}</label>
            <input
              value={labels[r]}
              onChange={(e) => setLabels({ ...labels, [r]: e.target.value })}
              placeholder={t(r)}
              className="w-full px-3 py-2 rounded-md border border-input text-sm font-body"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body">
          <Check className="w-3.5 h-3.5" /> {t("save")}
        </button>
        <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body">
          <X className="w-3.5 h-3.5" /> {t("cancel")}
        </button>
      </div>
    </div>
  );
}