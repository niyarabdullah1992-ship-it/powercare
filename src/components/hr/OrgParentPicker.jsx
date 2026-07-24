import React from "react";

export default function OrgParentPicker({ nodes, employees, stations, currentId, value, onChange, ar }) {
  const excluded = new Set(currentId ? [currentId] : []);
  let changed = true;
  while (changed) {
    changed = false;
    nodes.forEach((node) => {
      if (node.parentId && excluded.has(node.parentId) && !excluded.has(node.id)) { excluded.add(node.id); changed = true; }
    });
  }
  const options = nodes.filter((node) => !excluded.has(node.id));
  const labelFor = (node) => node.type === "station"
    ? stations.find((item) => item.id === node.refId)?.name
    : employees.find((item) => item.id === node.refId)?.name;

  return <label className="block space-y-1.5">
    <span className="text-xs font-semibold">{ar ? "يتبع لـ" : "Reports to"}</span>
    <select value={value || ""} onChange={(event) => onChange(event.target.value || null)} className="w-full rounded-md border px-3 py-2 text-sm">
      <option value="">{ar ? "أعلى الشجرة" : "Top level"}</option>
      {options.map((node) => <option key={node.id} value={node.id}>
        {node.type === "station" ? (ar ? "محطة" : "Site") : (ar ? "موظف" : "Employee")} — {labelFor(node) || node.title}
      </option>)}
    </select>
    <span className="block text-[11px] text-muted-foreground">{ar ? "اختر المحطة أو الموظف الأعلى مباشرة، ثم احفظ." : "Choose the direct parent station or employee, then save."}</span>
  </label>;
}