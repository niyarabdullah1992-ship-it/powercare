import React from "react";
import { hintText, labelText, selectField } from "@/lib/orgModalStyles";

export default function StationManagerField({ value, onChange, employees, ar }) {
  return (
    <label style={{ display: "block" }}>
      <span style={labelText}>
        {ar ? "مدير الفرع (اختياري)" : "Branch manager (optional)"}
      </span>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        style={selectField}
      >
        <option value="">{ar ? "بدون مدير" : "No manager"}</option>
        {(employees || []).map((employee) => (
          <option key={employee.id} value={employee.id}>{employee.name}</option>
        ))}
      </select>
      <span style={hintText}>
        {ar ? "يمكن تعيين المدير لاحقًا من الهيكل." : "You can assign a manager later from the org tree."}
      </span>
    </label>
  );
}
