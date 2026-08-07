import React from "react";
import MovementCard from "@/components/inventory/MovementCard";

export default function WorkIssueHistory({ movements = [], items = [], stations = [], employees = [], ar }) {
  const issues = movements.filter((entry) => entry.movementType === "issue");
  const itemName = (id) => items.find((item) => item.id === id)?.name || "—";
  const stationName = (id) => stations.find((station) => (station.stationId || station.id) === id)?.name || "—";
  const personName = (value) => {
    const employee = employees.find((entry) => entry.employeeId === value || entry.id === value || entry.email === value);
    return employee?.name || value || "—";
  };
  return (
    <section className="space-y-3">
      <div><h3 className="font-semibold">{ar ? "سجل الصرف للعمل" : "Work issue history"}</h3><p className="text-sm text-muted-foreground">{ar ? "جميع الكميات التي تم صرفها من المخزون للعمل." : "All quantities issued from inventory to work."}</p></div>
      {issues.map((entry) => <MovementCard key={entry.id} entry={entry} itemName={itemName} stationName={stationName} personName={personName} canReverse={false} onReverse={() => {}} ar={ar} />)}
      {!issues.length && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{ar ? "لا توجد عمليات صرف مسجلة." : "No work issues recorded."}</p>}
    </section>
  );
}