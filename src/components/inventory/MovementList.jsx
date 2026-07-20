import React, { useState } from "react";
import MovementFilters from "@/components/inventory/MovementFilters";
import MovementExportButtons from "@/components/inventory/MovementExportButtons";
import MovementRow from "@/components/inventory/MovementRow";

export default function MovementList({ movements, items, stations, employees = [], ar }) {
  const [stationId, setStationId] = useState(""); const [type, setType] = useState("");
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
    <div className="overflow-hidden rounded-xl border border-border bg-card"><table className="mobile-cards w-full text-sm"><thead className="bg-muted/50"><tr><th className="p-3 text-start">{ar ? "التاريخ" : "Date"}</th><th className="p-3 text-start">{ar ? "الصنف" : "Item"}</th><th className="p-3 text-start">{ar ? "الحركة" : "Type"}</th><th className="p-3 text-start">{ar ? "الحالة" : "Status"}</th><th className="p-3 text-start">{ar ? "الكمية" : "Qty"}</th><th className="p-3 text-start">{ar ? "من / إلى" : "From / To"}</th><th className="p-3 text-start">{ar ? "الموظف المسؤول" : "Responsible employee"}</th><th className="p-3 text-start">{ar ? "منفذ العملية" : "Performed by"}</th><th className="p-3 text-start">{ar ? "قبل" : "Before"}</th><th className="p-3 text-start">{ar ? "بعد" : "After"}</th><th /></tr></thead><tbody>{filtered.map((entry) => <MovementRow key={entry.id} entry={entry} itemName={itemName} stationName={stationName} personName={personName} ar={ar} />)}</tbody></table>{!filtered.length && <p className="p-8 text-center text-muted-foreground">{ar ? "لا توجد حركات مطابقة." : "No matching movements."}</p>}</div>
  </div>;
}