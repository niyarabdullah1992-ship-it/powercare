import React, { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import EmployeeAvatar from "./EmployeeAvatar";
import { assignEmployeeToShift, unassignEmployeeFromShift } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

export default function ScheduleCell({ companyId, stationId, day, shiftTypeId, employeeIds, employees, canManage }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const assigned = employees.filter((e) => employeeIds.includes(e.id));

  const toggle = (empId) => {
    if (employeeIds.includes(empId)) unassignEmployeeFromShift(companyId, stationId, day, shiftTypeId, empId);
    else assignEmployeeToShift(companyId, stationId, day, shiftTypeId, empId);
  };

  return (
    <div className="space-y-1 min-w-[110px]">
      {assigned.map((emp) => (
        <div key={emp.id} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 text-xs font-body">
          <EmployeeAvatar name={emp.name} size={18} />
          <span className="truncate flex-1">{emp.name}</span>
          {canManage && (
            <button onClick={() => toggle(emp.id)} className="text-muted-foreground hover:text-destructive shrink-0">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
      {canManage && (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded-md border border-dashed border-border text-[11px] font-body text-muted-foreground hover:border-accent hover:text-accent transition-colors"
        >
          <Plus className="w-3 h-3" /> {t("add")}
        </button>
      )}
      {/* Native-style overlay panel: bottom sheet on phones, centered on larger screens */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center sm:justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-card rounded-t-2xl sm:rounded-xl border border-border max-h-[70vh] overflow-y-auto pb-safe shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-4 pt-4 pb-2 text-xs uppercase tracking-wider text-muted-foreground font-body sticky top-0 bg-card">
              {t("add")}
            </p>
            {employees.map((emp) => {
              const isAssigned = employeeIds.includes(emp.id);
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggle(emp.id)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-body text-start hover:bg-muted ${isAssigned ? "text-accent font-medium" : ""}`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <EmployeeAvatar name={emp.name} size={20} />
                    <span className="truncate">{emp.name}</span>
                  </span>
                  {isAssigned && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
            {employees.length === 0 && <p className="text-sm text-muted-foreground font-body px-4 py-3">{t("noTasks")}</p>}
          </div>
        </div>
      )}
    </div>
  );
}