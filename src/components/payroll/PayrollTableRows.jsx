import React from "react";
import { AlertCircle, MapPin } from "lucide-react";
import PayrollRow from "@/components/payroll/PayrollRow";

export default function PayrollTableRows({ items, stations, getStationId, employeeForItem, ar, onChange, onTogglePaid, onPayslip, onDeductions }) {
  const groups = stations.map((station) => ({
    id: station.id,
    name: station.name,
    items: items.filter((item) => getStationId(item) === station.id),
  })).filter((group) => group.items.length);
  const unassigned = items.filter((item) => !getStationId(item));
  if (unassigned.length) groups.push({ id: "__unassigned__", name: ar ? "غير مخصص" : "Unassigned", items: unassigned, unassigned: true });

  return groups.map((group) => (
    <React.Fragment key={group.id}>
      <tr className={group.unassigned ? "border-y border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/25" : "border-y border-border bg-secondary/70"}>
        <td colSpan={8} className="px-4 py-3 text-start">
          <div className="flex items-center gap-2">
            {group.unassigned ? <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" /> : <MapPin className="h-4 w-4 shrink-0 text-accent" />}
            <div><p className="text-sm font-semibold">{group.name}</p>{group.unassigned && <p className="text-[11px] font-normal text-muted-foreground">{ar ? "موظفون غير مرتبطين بمحطة" : "Employees not linked to a station"}</p>}</div>
          </div>
        </td>
      </tr>
      {group.items.map((item) => <PayrollRow key={item.id} item={item} employee={employeeForItem(item)} ar={ar} onChange={(field, value) => onChange(item.id, field, value)} onTogglePaid={(paid) => onTogglePaid(item, paid)} onPayslip={() => onPayslip(item)} onDeductions={() => onDeductions(item)} />)}
    </React.Fragment>
  ));
}