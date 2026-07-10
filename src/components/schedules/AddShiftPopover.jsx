import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function AddShiftPopover({ onSave, onCancel, employees = [] }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ label: "", employeeIds: [], start: "08:00", end: "16:00" });

  const toggleEmployee = (id) => {
    setForm((f) => ({
      ...f,
      employeeIds: f.employeeIds.includes(id) ? f.employeeIds.filter((x) => x !== id) : [...f.employeeIds, id],
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    const employeeNames = employees.filter((emp) => form.employeeIds.includes(emp.id)).map((emp) => emp.name);
    onSave({
      label: form.label.trim(),
      employeeIds: form.employeeIds,
      employeeNames,
      start: form.start,
      end: form.end,
    });
  };

  return (
    <form onSubmit={submit} className="absolute z-40 top-full mt-2 end-0 w-72 p-3 rounded-lg border border-landing-gold/30 bg-white shadow-xl space-y-2">
      {employees.length > 0 && (
        <div className="max-h-32 overflow-y-auto rounded-md border border-input p-1.5 space-y-1">
          {employees.map((emp) => (
            <label key={emp.id} className="flex items-center gap-2 text-xs font-body px-1 py-0.5 rounded hover:bg-muted cursor-pointer">
              <input type="checkbox" checked={form.employeeIds.includes(emp.id)} onChange={() => toggleEmployee(emp.id)} className="accent-current" />
              {emp.name}
            </label>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder={t("shiftLabel")} className="flex-1 min-w-0 px-2 py-1.5 rounded-md border border-input text-xs font-body" />
        <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required className="px-2 py-1.5 rounded-md border border-input text-xs font-body" />
        <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} required className="px-2 py-1.5 rounded-md border border-input text-xs font-body" />
      </div>
      <div className="flex gap-1.5">
        <button type="submit" className="flex-1 py-1.5 rounded-md bg-gradient-to-b from-landing-gold-light to-landing-gold text-white text-xs font-body font-medium">{t("save")}</button>
        <button type="button" onClick={onCancel} className="flex-1 py-1.5 rounded-md border border-border text-xs font-body">{t("cancel")}</button>
      </div>
    </form>
  );
}