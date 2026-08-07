import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateCompany } from "@/lib/store";
import { levelName } from "@/lib/hrLevels";
import HRSlotRow from "@/components/hr/HRSlotRow";
import HRAssignModal from "@/components/hr/HRAssignModal";

// A single position tier's card, scoped to a station, a cluster, or the whole company.
// managerLevel/assistantLevel are the company's own (possibly renamed/custom) level objects.
export default function HRTierCard({ managerLevel, assistantLevel, scopeType, scopeId, scopeName, data, canManage }) {
  const { t, lang } = useI18n();
  const [addingRole, setAddingRole] = useState(null); // "manager" | "assistant" | null

  const matchesScope = (e) => {
    if (scopeType === "station") return e.hrStationId === scopeId;
    if (scopeType === "cluster") return e.hrClusterId === scopeId;
    return true;
  };

  const managers = managerLevel ? data.employees.filter((e) => e.hrLevelId === managerLevel.id && matchesScope(e)) : [];
  const assistants = assistantLevel ? data.employees.filter((e) => e.hrLevelId === assistantLevel.id && matchesScope(e)) : [];
  const eligible = data.employees.filter((e) => !e.hrLevelId);
  const activeLevel = addingRole === "manager" ? managerLevel : assistantLevel;

  const assignToSlot = (emp, position) => {
    emp.hrLevelId = activeLevel.id;
    emp.hrStationId = scopeType === "station" ? scopeId : null;
    emp.hrClusterId = scopeType === "cluster" ? scopeId : null;
    if (position) emp.position = position;
  };

  const assignExisting = (empId, position) => {
    updateCompany(data.id, (d) => {
      const emp = d.employees.find((x) => x.id === empId);
      if (emp) assignToSlot(emp, position);
    });
  };

  const hireNew = ({ name, email, position }) => {
    updateCompany(data.id, (d) => {
      const emp = {
        id: "emp_" + Math.random().toString(36).slice(2, 9),
        name, email: email || "", role: "employee",
        stationId: null, hrLevelId: null, hrStationId: null, hrClusterId: null,
        createdAt: new Date().toISOString(),
      };
      assignToSlot(emp, position);
      d.employees.push(emp);
    });
  };

  const removeFromSlot = (empId) => {
    updateCompany(data.id, (d) => {
      const emp = d.employees.find((x) => x.id === empId);
      if (!emp) return;
      emp.hrLevelId = null; emp.hrStationId = null; emp.hrClusterId = null;
    });
  };

  const updatePosition = (empId, position) => {
    updateCompany(data.id, (d) => {
      const emp = d.employees.find((x) => x.id === empId);
      if (!emp) return;
      emp.position = position || null;
    });
  };

  return (
    <div className="p-4 rounded-xl border border-accent/20 bg-gradient-to-b from-card to-secondary/40 shadow-sm space-y-3">
      <h4 dir="auto" className="font-heading text-base tracking-wide">{scopeName}</h4>
      {managerLevel && (
        <HRSlotRow
          label={levelName(managerLevel, lang)}
          roleTag="manager"
          employees={managers}
          canManage={canManage}
          onAdd={() => setAddingRole("manager")}
          onRemove={removeFromSlot}
          onUpdatePosition={updatePosition}
        />
      )}
      {assistantLevel && (
        <HRSlotRow
          label={levelName(assistantLevel, lang)}
          roleTag="assistant"
          employees={assistants}
          canManage={canManage}
          onAdd={() => setAddingRole("assistant")}
          onRemove={removeFromSlot}
          onUpdatePosition={updatePosition}
        />
      )}

      {addingRole && (
        <HRAssignModal
          title={`${addingRole === "manager" ? t("assignManager") : t("assignAssistant")} — ${levelName(activeLevel, lang)}`}
          defaultPosition={levelName(activeLevel, lang)}
          eligibleEmployees={eligible}
          onAssignExisting={assignExisting}
          onHireNew={hireNew}
          onClose={() => setAddingRole(null)}
        />
      )}
    </div>
  );
}