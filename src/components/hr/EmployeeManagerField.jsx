import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

export default function EmployeeManagerField({ value, onChange, placement, onPlacementChange, stations, ar }) {
  const toggle = (stationId) => {
    const next = value.includes(stationId) ? value.filter((id) => id !== stationId) : [...value, stationId];
    if ((placement === "single" && next.length !== 1) || (placement === "group" && next.length < 2)) onPlacementChange("none");
    onChange(next);
  };
  const options = [
    ["none", ar ? "بدون تغيير موقعه" : "Keep current position", false],
    ["single", ar ? "تحت الفرع" : "Below the station", value.length !== 1],
    ["group", ar ? "فوق مجموعة الفروع" : "Above station group", value.length < 2],
  ];
  return (
    <fieldset className="space-y-3 rounded-md border border-border p-3">
      <legend className="px-1 text-xs font-medium text-muted-foreground">{ar ? "تعيين الموظف مديرًا للفروع" : "Assign employee as station manager"}</legend>
      <p className="text-[11px] text-muted-foreground">{ar ? "عدم اختيار أي فرع يعني أن الموظف ليس مديرًا." : "No selected station means the employee is not a manager."}</p>
      <div className="grid gap-2 sm:grid-cols-2">{stations.map((station) => <label key={station.id} className="flex cursor-pointer items-center gap-2 rounded-md bg-muted/40 px-2 py-2 text-xs"><Checkbox checked={value.includes(station.id)} onCheckedChange={() => toggle(station.id)} />{station.name}</label>)}</div>
      <div className="space-y-1"><p className="text-[11px] font-medium text-muted-foreground">{ar ? "موضع المدير في الشجرة (اختياري)" : "Manager position in tree (optional)"}</p><div className="flex flex-wrap gap-2">{options.map(([id, label, disabled]) => <button key={id} type="button" disabled={disabled} onClick={() => onPlacementChange(id)} className={`rounded-md border px-3 py-1.5 text-xs ${placement === id ? "border-[#14284B] bg-[#F7F8FA] text-[#14284B]" : "border-border"} disabled:opacity-35`}>{label}</button>)}</div></div>
    </fieldset>
  );
}