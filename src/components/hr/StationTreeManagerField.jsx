import React from "react";
import { UserCog } from "lucide-react";

export default function StationTreeManagerField({ employees, value, onChange, ar }) {
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <UserCog className="h-4 w-4 text-accent" />
        {ar ? "مدير هذه المحطة" : "Station manager"}
      </label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
        <option value="">{ar ? "اختر المدير من موظفي المحطة" : "Select from this station's employees"}</option>
        {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
      </select>
      <p className="mt-2 text-[11px] text-muted-foreground">{ar ? "يظهر هذا الخيار عند وجود مجموعة موظفين تحت المحطة." : "Choose who manages the employee group under this station."}</p>
    </div>
  );
}