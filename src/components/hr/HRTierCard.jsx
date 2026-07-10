import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateCompany } from "@/lib/store";
import { tierLevelId, tierName } from "@/lib/hrLevels";
import HRSlotRow from "@/components/hr/HRSlotRow";
import HRAssignModal from "@/components/hr/HRAssignModal";

// A single tier's card, scoped to a station (tier 1), a cluster (tier 2), or the whole company (tiers 3-5).
export default function HRTierCard({ tier, scopeType, scopeId, scopeName, data, canManage }) {
  const { t, lang } = useI18n();
  const [addingRole, setAddingRole] = useState(null); // "manager" | "assistant" | null

  const managerLevelId = tierLevelId(tier, "manager");
  const assistantLevelId = tierLevelId(tier, "assistant");

  const matchesScope = (e) => {
    if (scopeType === "station") return e.hrStationId === scopeId;
    if (scopeType === "cluster") return e.hrClusterId === scopeId;
    return true;
  };

  const managers = data.employees.filter((e) => e.hrLevelId === managerLevelId && matchesScope(e));
  const assistants = data.employees.filter((e) => e.hrLevelId === assistantLevelId && matchesScope(e));
  const eligible = data.employees.filter((e) => !e.hrLevelId);

  const assignToSlot = (emp, role) => {
    emp.hrLevelId = role === "manager" ? managerLevelId : assistantLevelId;
    emp.hrStationId = scopeType === "station" ? scopeId : null;
    emp.hrClusterId = scopeType === "cluster" ? scopeId : null;
  };

  const assignExisting = (empId) => {
    updateCompany(data.id, (d) => {
      const emp = d.employees.find((x) => x.id === empId);
      if (emp) assignToSlot(emp, addingRole);
    });
  };

  const hireNew = ({ name, email }) => {
    updateCompany(data.id, (d) => {
      const emp = {
        id: "emp_" + Math.random().toString(36).slice(2, 9),
        name, email: email || "", role: "employee",
        stationId: null, hrLevelId: null, hrStationId: null, hrClusterId: null,
        createdAt: new Date().toISOString(),
      };
      assignToSlot(emp, addingRole);
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

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <h4 className="font-heading font-semibold">{scopeName}</h4>
      <HRSlotRow
        label={tierName(tier, "manager", lang)}
        roleTag="manager"
        employees={managers}
        canManage={canManage}
        onAdd={() => setAddingRole("manager")}
        onRemove={removeFromSlot}
      />
      <HRSlotRow
        label={tierName(tier, "assistant", lang)}
        roleTag="assistant"
        employees={assistants}
        canManage={canManage}
        onAdd={() => setAddingRole("assistant")}
        onRemove={removeFromSlot}
      />

      {addingRole && (
        <HRAssignModal
          title={`${addingRole === "manager" ? t("assignManager") : t("assignAssistant")} — ${tierName(tier, addingRole, lang)}`}
          eligibleEmployees={eligible}
          onAssignExisting={assignExisting}
          onHireNew={hireNew}
          onClose={() => setAddingRole(null)}
        />
      )}
    </div>
  );
}