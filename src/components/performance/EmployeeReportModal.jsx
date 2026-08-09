import React from "react";
import { X } from "lucide-react";
import EmployeeSingleReport from "@/components/performance/EmployeeSingleReport";

// The individual report is no longer a tab — it opens on an employee name.
export default function EmployeeReportModal({ employeeId, t, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-4xl rounded-xl border border-border bg-card p-4 pb-safe" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex justify-end">
          <button onClick={onClose} className="rounded p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <EmployeeSingleReport t={t} initialEmployeeId={employeeId} />
      </div>
    </div>
  );
}