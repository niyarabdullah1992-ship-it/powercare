import React from "react";
import { AlertTriangle } from "lucide-react";
import OrgTreeUnassignedEmployeeCard from "@/components/hr/OrgTreeUnassignedEmployeeCard";

export default function OrgTreeUnassignedEmployees({ employees, canManage, actions, ar }) {
  if (!employees.length) return null;
  return (
    <aside className="border-b border-[#E2E8F0] bg-[#F7F8FA] px-3 py-2.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-[#B45309]" />
        <p className="text-[12px] font-semibold text-[#14284B]">
          {ar ? "بانتظار التنظيم" : "Needs placement"}{" "}
          <span className="font-normal text-[#5A6B85]">({employees.length})</span>
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {employees.map((employee) => (
          <OrgTreeUnassignedEmployeeCard
            key={employee.id}
            employee={employee}
            canManage={canManage}
            actions={actions}
            ar={ar}
          />
        ))}
      </div>
    </aside>
  );
}
