import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateEmployeeProfile } from "@/lib/store";
import { Pencil, Check, Briefcase, Building2, CalendarDays, IdCard, MapPin, FileText } from "lucide-react";

const GROUPS = [
  { label: "employmentInfo", fields: [
    { key: "position", icon: Briefcase },
    { key: "department", icon: Building2 },
    { key: "hireDate", icon: CalendarDays, type: "date" },
  ] },
  { label: "personalInfo", fields: [
    { key: "nationalId", icon: IdCard },
    { key: "address", icon: MapPin },
    { key: "notes", icon: FileText, area: true },
  ] },
];

export default function ProfessionalInfoTab({ employee, companyId, canEdit, fallbackPosition }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const profile = employee.profile || {};
  const allFields = GROUPS.flatMap((g) => g.fields.map((f) => f.key));
  const [form, setForm] = useState(() =>
    allFields.reduce((acc, f) => ({ ...acc, [f]: profile[f] || (f === "position" ? fallbackPosition || "" : "") }), {})
  );

  const save = () => {
    updateEmployeeProfile(companyId, employee.id, form);
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          {editing ? (
            <button onClick={save} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-foreground text-background text-xs font-body">
              <Check className="w-3.5 h-3.5" /> {t("save")}
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
              <Pencil className="w-3.5 h-3.5" /> {t("edit")}
            </button>
          )}
        </div>
      )}

      {GROUPS.map((group) => (
        <div key={group.label} className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wide">{t(group.label)}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.fields.map(({ key, icon: Icon, type, area }) => (
              <div key={key} className={area ? "md:col-span-2" : ""}>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-body mb-1.5">
                  <Icon className="w-3.5 h-3.5 text-accent" /> {t(key)}
                </label>
                {editing ? (
                  area ? (
                    <textarea value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body resize-none" />
                  ) : (
                    <input type={type || "text"} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
                  )
                ) : (
                  <p className="text-sm font-body px-3 py-2 rounded-md bg-muted/40 min-h-[38px]">{profile[key] || (key === "position" ? fallbackPosition : "") || "—"}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}