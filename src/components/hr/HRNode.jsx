import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateCompany } from "@/lib/store";
import { UserCog, Plus, X, Trash2 } from "lucide-react";
import AddHRModal from "@/components/hr/AddHRModal";
import { hrPermLabel, hrPermDescription } from "@/lib/hrPermissions";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

export default function HRNode({ employee, allEmployees, levels, stations, companyId, currentUser, depth = 0 }) {
  const { t, lang } = useI18n();
  const [showAdd, setShowAdd] = useState(false);
  const level = levels.find((l) => l.id === employee.hrLevelId);
  const children = allEmployees.filter((e) => e.hrParentId === employee.id);
  const canManageNode = currentUser.role === "director" || currentUser.id === employee.id;
  const eligible = allEmployees.filter((e) => !e.hrLevelId && e.id !== employee.id);
  // A station-scoped HR member can only manage subordinates within their own station.
  const levelsForAdd = employee.hrStationId ? levels.filter((l) => l.scope !== "company") : levels;

  const addSubordinate = (empId, levelId, stationId) => {
    const lvl = levels.find((l) => l.id === levelId);
    if (lvl?.maxCount && allEmployees.filter((e) => e.hrLevelId === levelId).length >= lvl.maxCount) {
      alert(t("levelFull"));
      return;
    }
    updateCompany(companyId, (d) => {
      const emp = d.employees.find((x) => x.id === empId);
      if (!emp) return;
      emp.hrLevelId = levelId;
      emp.hrParentId = employee.id;
      emp.hrStationId = employee.hrStationId || stationId || null;
    });
  };

  const removeFromHR = () => {
    updateCompany(companyId, (d) => {
      const removeIds = new Set([employee.id]);
      let changed = true;
      while (changed) {
        changed = false;
        d.employees.forEach((e) => {
          if (e.hrParentId && removeIds.has(e.hrParentId) && !removeIds.has(e.id)) { removeIds.add(e.id); changed = true; }
        });
      }
      d.employees.forEach((e) => {
        if (removeIds.has(e.id)) { e.hrLevelId = null; e.hrParentId = null; e.hrStationId = null; }
      });
    });
  };

  const deleteEmployee = () => {
    updateCompany(companyId, (d) => {
      d.employees.forEach((e) => {
        if (e.hrParentId === employee.id) e.hrParentId = null;
      });
      d.employees = d.employees.filter((e) => e.id !== employee.id);
    });
  };

  return (
    <div style={{ marginInlineStart: depth * 20 }} className="space-y-2">
      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
        <div className="flex items-center gap-2 min-w-0">
          <UserCog className="w-4 h-4 text-accent shrink-0" strokeWidth={1.75} />
          <div className="min-w-0">
            <p className="text-sm font-body font-medium truncate">{employee.name}</p>
            <p className="text-[10px] text-muted-foreground font-body">{level?.name || "—"}</p>
            {level?.permissions?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {level.permissions.map((p) => (
                  <span key={p} title={hrPermDescription(p, lang)} className="px-1.5 py-0.5 rounded-full bg-muted text-[9px] font-body text-muted-foreground cursor-help">{hrPermLabel(p, lang)}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        {canManageNode && (
          <div className="flex items-center gap-1 shrink-0">
            {levelsForAdd.length > 0 && (
              <button onClick={() => setShowAdd(true)} className="p-1.5 rounded-md hover:bg-muted text-accent" title={t("addSubordinate")}>
                <Plus className="w-4 h-4" />
              </button>
            )}
            <ConfirmDeleteDialog
              onConfirm={removeFromHR}
              trigger={
                <button className="p-1.5 rounded-md hover:bg-muted text-destructive" title={t("removeHR")}>
                  <X className="w-4 h-4" />
                </button>
              }
            />
            <ConfirmDeleteDialog
              onConfirm={deleteEmployee}
              trigger={
                <button className="p-1.5 rounded-md hover:bg-muted text-destructive" title={t("delete")}>
                  <Trash2 className="w-4 h-4" />
                </button>
              }
            />
          </div>
        )}
      </div>

      {children.length > 0 && (
        <div className="space-y-2">
          {children.map((c) => (
            <HRNode key={c.id} employee={c} allEmployees={allEmployees} levels={levels} stations={stations} companyId={companyId} currentUser={currentUser} depth={depth + 1} />
          ))}
        </div>
      )}

      {showAdd && (
        <AddHRModal
          title={t("addSubordinate")}
          employees={eligible}
          levels={levelsForAdd}
          stations={employee.hrStationId ? null : stations}
          onAdd={addSubordinate}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}