import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

export default function EmployeeManagerField({ value, onChange, stations, ar }) {
  const toggle = (stationId) => onChange(value.includes(stationId) ? value.filter((id) => id !== stationId) : [...value, stationId]);
  return (
    <fieldset className="space-y-2 rounded-md border border-border p-3">
      <legend className="px-1 text-xs font-medium text-muted-foreground">{ar ? "تعيين الموظف مديرًا للمحطات" : "Assign employee as station manager"}</legend>
      <p className="text-[11px] text-muted-foreground">{ar ? "عدم اختيار أي محطة يعني أن الموظف ليس مديرًا." : "No selected station means the employee is not a manager."}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {stations.map((station) => <label key={station.id} className="flex cursor-pointer items-center gap-2 rounded-md bg-muted/40 px-2 py-2 text-xs"><Checkbox checked={value.includes(station.id)} onCheckedChange={() => toggle(station.id)} />{station.name}</label>)}
      </div>
    </fieldset>
  );
}