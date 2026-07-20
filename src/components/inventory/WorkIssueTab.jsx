import React from "react";
import WorkIssueForm from "@/components/inventory/WorkIssueForm";

export default function WorkIssueTab({ items, employees, stationId, canIssue, onSubmit, ar }) {
  if (!canIssue) return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{ar ? "الصرف للعمل متاح لمسؤولي المحطات فقط. يمكن مراجعة العمليات من سجل الحركات." : "Work issue is available to station operators only. Review operations in the movement log."}</p>;
  return <WorkIssueForm items={items} employees={employees} stationId={stationId} onSubmit={onSubmit} ar={ar} />;
}