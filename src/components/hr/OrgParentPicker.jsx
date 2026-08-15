import React from "react";
import { hintText, labelText, selectField } from "@/lib/orgModalStyles";

export default function OrgParentPicker({ nodes, employees, stations, currentId, value, onChange, ar }) {
  const options = nodes.filter((node) => node.id !== currentId);
  const labelFor = (node) => (node.type === "station"
    ? stations.find((item) => item.id === node.refId)?.name
    : employees.find((item) => item.id === node.refId)?.name);

  return (
    <label style={{ display: "block" }}>
      <span style={labelText}>
        {ar ? "العقدة الأعلى المباشرة" : "Direct parent"}
      </span>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value || null)}
        style={selectField}
      >
        <option value="">{ar ? "أعلى الشجرة" : "Top level"}</option>
        {options.map((node) => (
          <option key={node.id} value={node.id}>
            {node.type === "station" ? (ar ? "فرع" : "Branch") : (ar ? "موظف" : "Employee")}
            {" — "}
            {labelFor(node) || node.title}
          </option>
        ))}
      </select>
      <span style={hintText}>
        {ar
          ? "يمكن للفرع احتواء موظفين وفروع فرعية معًا."
          : "A branch can hold employees and child branches together."}
      </span>
    </label>
  );
}
