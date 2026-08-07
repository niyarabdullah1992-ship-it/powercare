import React from "react";

export default function StationManagerField({ value, onChange, employees, ar }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-muted-foreground">
        {ar ? "مدير المحطة (اختياري)" : "Station manager (optional)"}
      </label>
      <select value={value || ""} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
        <option value="">{ar ? "بدون مدير" : "No manager"}</option>
        {(employees || []).map((employee) => (
          <option key={employee.id} value={employee.id}>{employee.name}</option>
        ))}
      </select>
    </div>
  );
}