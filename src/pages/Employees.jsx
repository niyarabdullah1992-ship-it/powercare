import React, { useState } from "react";
import { Users, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { stationIdForTreeEmployee } from "@/lib/orgTree";
import PageHeader from "@/components/PageHeader";
import StationBranchCard from "@/components/employees/StationBranchCard";
import StationEmployeeCards from "@/components/employees/StationEmployeeCards";

const UNASSIGNED = "__unassigned__";

export default function Employees() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data } = useAuth();
  const [selectedId, setSelectedId] = useState(null);

  const employeesOf = (stationId) =>
    (data?.employees || []).filter((employee) => (stationIdForTreeEmployee(data, employee.id) || employee.stationId || UNASSIGNED) === stationId);

  const branches = [
    ...(data?.stations || []).map((station) => ({ id: station.id, name: station.name, location: station.location })),
    { id: UNASSIGNED, name: ar ? "غير مخصص لفرع" : "Unassigned" },
  ]
    .map((branch) => ({ ...branch, employees: employeesOf(branch.id) }))
    .filter((branch) => branch.id !== UNASSIGNED || branch.employees.length > 0);

  const selected = branches.find((branch) => branch.id === selectedId) || null;

  return (
    <div className="space-y-5">
      <PageHeader
        title={ar ? "الموظفون" : "Employees"}
        description={selected ? selected.name : (ar ? "اختر الفرع لعرض موظفيه" : "Choose a branch to view its employees")}
        icon={Users}
        actions={selected && (
          <button onClick={() => setSelectedId(null)} className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-sm hover:bg-muted">
            <ArrowRight className="h-4 w-4 ltr:rotate-180" /> {ar ? "كل الفروع" : "All branches"}
          </button>
        )}
      />

      {selected ? (
        <StationEmployeeCards employees={selected.employees} ar={ar} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <StationBranchCard
              key={branch.id}
              name={branch.name}
              location={branch.location}
              count={branch.employees.length}
              ar={ar}
              onClick={() => setSelectedId(branch.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}