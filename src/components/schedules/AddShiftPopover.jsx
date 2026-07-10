import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function AddShiftPopover({ onSave, onCancel, employees = [] }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ label: "", employeeId: "", start: "08:00", end: "16:00" });

  const submit = (e) => {
    e.preventDefault();
    const employee = employees.find((emp) => emp.id === form.employeeId);
    onSave({
      label: form.label.trim(),
      employeeId: form.employeeId || null,
      employeeName: employee ? employee.name : "",
      start: form.start,
      end: form.end,
    });
  };

  return (
    <form onSubmit={submit} className="absolute z-40 top-full mt-2 end-0 w-72 p-3 rounded-lg border border-landing-gold/30 bg-white shadow-xl space-y-2">
      {employees.length > 0 && (
        <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-2 py-1.5 rounded-md border border-input text-xs font-body bg-white">
          <option value="">{t("selectEmployee")}</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
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