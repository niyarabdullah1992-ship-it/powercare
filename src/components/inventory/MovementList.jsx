import React, { useState } from "react";
import MovementFilters from "@/components/inventory/MovementFilters";
import MovementExportButtons from "@/components/inventory/MovementExportButtons";
import MovementCard from "@/components/inventory/MovementCard";
import ReverseMovementDialog from "@/components/inventory/ReverseMovementDialog";

export default function MovementList({ movements, items, stations, employees = [], canReverse, onReverse, ar }) {
  const [stationId, setStationId] = useState(""); const [type, setType] = useState("");
  const [reversing, setReversing] = useState(null);
  const filtered = movements.filter((entry) => (!stationId || entry.fromLocationId === stationId || entry.toLocationId === stationId) && (!type || entry.movementType === type));
  const itemName = (id) => items.find((item) => item.id === id)?.name || "—";
  const stationName = (id) => stations.find((station) => station.stationId === id)?.name || "—";
  const personName = (value) => {
    if (!value) return "—";
    const employee = employees.find((entry) => entry.employeeId === value || entry.id === value || entry.email === value);
    if (employee) return employee.name;
    return /^\d+$/.test(String(value)) ? (ar ? "موظف غير معروف" : "Unknown employee") : value;
  };
  return <div className="space-y-3"><div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 lg:flex-row lg:items-center lg:justify-between"><MovementFilters stationId={stationId} type={type} stations={stations} onStation={setStationId} onType={setType} ar={ar} /><MovementExportButtons movements={filtered} items={items} stations={stations} employees={employees} ar={ar} /></div>
    <div className="space-y-3">{filtered.map((entry) => <MovementCard key={entry.id} entry={entry} itemName={itemName} stationName={stationName} personName={personName} canReverse={canReverse} onReverse={() => setReversing(entry)} ar={ar} />)}{!filtered.length && <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">{ar ? "لا توجد حركات مطابقة." : "No matching movements."}</p>}</div>
    <ReverseMovementDialog movement={reversing} items={items} stations={stations} onClose={() => setReversing(null)} onConfirm={(reason) => onReverse(reversing.id, reason)} ar={ar} />
  </div>;
}