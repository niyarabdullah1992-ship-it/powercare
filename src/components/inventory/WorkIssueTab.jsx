import React from "react";
import WorkIssueForm from "@/components/inventory/WorkIssueForm";
import WorkIssueHistory from "@/components/inventory/WorkIssueHistory";

export default function WorkIssueTab({ items, historyItems, movements, employees, stations, historyStations, stationId, canIssue, canChooseStation, onSubmit, ar }) {
  return <div className="space-y-6">
    {canIssue ? <WorkIssueForm items={items} employees={employees} stations={stations} stationId={stationId} canChooseStation={canChooseStation} onSubmit={onSubmit} ar={ar} /> : <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{ar ? "ليست لديك صلاحية الصرف للعمل." : "You do not have work issue permission."}</p>}
    <WorkIssueHistory movements={movements} items={historyItems} stations={historyStations} employees={employees} ar={ar} />
  </div>;
}