import React from "react";
import WorkIssueForm from "@/components/inventory/WorkIssueForm";

export default function WorkIssueTab({ items, employees, stations, stationId, canIssue, canChooseStation, onSubmit, ar }) {
  if (!canIssue) return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{ar ? "ليست لديك صلاحية الصرف للعمل. يمكن مراجعة العمليات من سجل الحركات." : "You do not have work issue permission. Review operations in the movement log."}</p>;
  return <WorkIssueForm items={items} employees={employees} stations={stations} stationId={stationId} canChooseStation={canChooseStation} onSubmit={onSubmit} ar={ar} />;
}