import React, { useState } from "react";
import { Users, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { stationIdForTreeEmployee } from "@/lib/orgTree";
import PageHeader from "@/components/PageHeader";
import StationEmployeesSection from "@/components/employees/StationEmployeesSection";

const UNASSIGNED = "__unassigned__";

export default function Employees() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data } = useAuth();
  const [query, setQuery] = useState("");

  const employees = (data?.employees || []).filter((employee) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [employee.name, employee.email, employee.profile?.position, employee.profile?.jobNumber]
      .some((value) => String(value || "").toLowerCase().includes(term));
  });

  const groups = [
    ...(data?.stations || []).map((station) => ({ id: station.id, name: station.name })),
    { id: UNASSIGNED, name: ar ? "غير مخصص لمحطة" : "Unassigned" },
  ].map((group) => ({
    ...group,
    employees: employees.filter((employee) => (stationIdForTreeEmployee(data, employee.id) || employee.stationId || UNASSIGNED) === group.id),
  })).filter((group) => group.id !== UNASSIGNED || group.employees.length > 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title={ar ? "الموظفون" : "Employees"}
        description={ar ? "بيانات الموظفين مصنّفة حسب كل محطة أو فرع" : "Employee records grouped by station or branch"}
        icon={Users}
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 my-auto h-4 w-4 text-muted-foreground start-3" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ar ? "بحث عن موظف..." : "Search employee..."}
              className="w-full min-w-[220px] rounded-md border border-input bg-card py-2 text-sm ps-9 pe-3"
            />
          </div>
        }
      />

      <div className="space-y-3">
        {groups.map((group) => (
          <StationEmployeesSection key={group.id} stationName={group.name} employees={group.employees} ar={ar} />
        ))}
      </div>
    </div>
  );
}