import React from "react";
import WorkIssueForm from "@/components/inventory/WorkIssueForm";
import MovementList from "@/components/inventory/MovementList";

export default function WorkIssueTab({ items, movements, employees, stations, stationId, canIssue, onSubmit, ar }) {
  return <div className="space-y-4">
    {canIssue && <WorkIssueForm items={items} employees={employees} stationId={stationId} onSubmit={onSubmit} ar={ar} />}
    <MovementList movements={movements.filter((entry) => entry.movementType === "issue")} items={items} stations={stations} employees={employees} ar={ar} />
  </div>;
}