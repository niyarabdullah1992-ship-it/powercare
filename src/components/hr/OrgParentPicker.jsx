import React from "react";

function blockedIds(nodes, currentId) {
  const blocked = new Set(currentId ? [currentId] : []);
  let changed = true;
  while (changed) {
    changed = false;
    nodes.forEach((node) => {
      if (blocked.has(node.parentId) && !blocked.has(node.id)) {
        blocked.add(node.id);
        changed = true;
      }
    });
  }
  return blocked;
}

export default function OrgParentPicker({ nodes, employees, stations, currentId, value, onChange, ar }) {
  const blocked = blockedIds(nodes, currentId);
  const options = nodes.filter((node) => !blocked.has(node.id));
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
    <span className="block text-[11px] text-muted-foreground">{ar ? "يمكن للمحطة نفسها احتواء موظفين ومحطات فرعية معًا." : "The same site can contain employees and child sites together."}</span>
  </label>;
}