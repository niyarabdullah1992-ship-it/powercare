import React, { useState, useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";
import EmployeeAvatar from "./EmployeeAvatar";
import { assignEmployeeToShift, unassignEmployeeFromShift } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

export default function ScheduleCell({ companyId, stationId, day, shiftTypeId, employeeIds, employees, canManage }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const assigned = employees.filter((e) => employeeIds.includes(e.id));

  const toggle = (empId) => {
    if (employeeIds.includes(empId)) unassignEmployeeFromShift(companyId, stationId, day, shiftTypeId, empId);
    else assignEmployeeToShift(companyId, stationId, day, shiftTypeId, empId);
  };

  return (
    <div className="space-y-1 relative min-w-[110px]">
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
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded-md border border-dashed border-border text-[11px] font-body text-muted-foreground hover:border-accent hover:text-accent transition-colors"
        >
          <Plus className="w-3 h-3" /> {t("add")}
        </button>
      )}
      {open && (
        <div ref={ref} className="absolute z-30 top-full mt-1 start-0 w-48 max-h-48 overflow-y-auto rounded-lg border border-landing-gold/30 bg-white shadow-xl p-1.5 space-y-0.5">
          {employees.map((emp) => (
            <label key={emp.id} className="flex items-center gap-2 text-xs font-body px-1.5 py-1 rounded hover:bg-muted cursor-pointer">
              <input type="checkbox" checked={employeeIds.includes(emp.id)} onChange={() => toggle(emp.id)} />
              {emp.name}
            </label>
          ))}
          {employees.length === 0 && <p className="text-xs text-muted-foreground px-1.5 py-1">{t("noTasks")}</p>}
        </div>
      )}
    </div>
  );
}