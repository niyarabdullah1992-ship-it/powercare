import React from "react";

export default function OrgParentPicker({ nodes, employees, stations, currentId, nodeType, value, onChange, ar }) {
  const options = nodes.filter((node) => node.id !== currentId);
  const labelFor = (node) => node.type === "station"
    ? stations.find((item) => item.id === node.refId)?.name
    : employees.find((item) => item.id === node.refId)?.name;

  return <label className="block space-y-1.5">
    <span className="text-xs font-semibold">{ar ? "العقدة الأعلى المباشرة" : "Direct parent"}</span>
    <select value={value || ""} onChange={(event) => onChange(event.target.value || null)} className="w-full rounded-md border px-3 py-2 text-sm">
      <option value="">{ar ? "أعلى الشجرة" : "Top level"}</option>
      {options.map((node) => <option key={node.id} value={node.id}>
        {node.type === "station" ? (ar ? "محطة" : "Site") : (ar ? "موظف" : "Employee")} — {labelFor(node) || node.title}
      </option>)}
    </select>
    <span className="block text-[11px] text-muted-foreground">{ar ? "يمكن وضع الموظفين أو المحطات تحت أي عقدة أعلى." : "Employees and sites can be placed under any parent node."}</span>
  </label>;
}