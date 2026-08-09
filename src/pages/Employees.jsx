import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { getRoleLabel } from "@/lib/roles";
import { employeeJobGrade, jobGradeLabel } from "@/lib/jobGrades";
import { EMPLOYEE_FILTERS } from "@/lib/employeeStatus";
import MobileSelect from "@/components/mobile/MobileSelect";
import EmployeeStatusFilters from "@/components/employees/EmployeeStatusFilters";
import EmployeeDirectoryTable from "@/components/employees/EmployeeDirectoryTable";

export default function Employees() {
  const { data, company } = useAuth();
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const [stationId, setStationId] = useState("all");
  const [statusFilter, setStatusFilter] = useState(null);
  const [query, setQuery] = useState("");

  const stations = data?.stations || [];
  const employees = data?.employees || [];
  const roleLabel = (role) => getRoleLabel(company, role, t);
  const stationName = (id) => stations.find((station) => station.id === id)?.name || "—";
  const gradeLabel = (employee) => jobGradeLabel(employeeJobGrade(employee, data));
  const managerName = (employee) => {
    const managerId = stations.find((s) => s.id === employee.stationId)?.managerId;
    return employees.find((e) => e.id === managerId)?.name || "";
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = EMPLOYEE_FILTERS.find((f) => f.key === statusFilter)?.match;
    return employees.filter((employee) => {
      if (stationId !== "all" && employee.stationId !== stationId) return false;
      if (match && !match(employee)) return false;
      if (!q) return true;
      return [employee.name, employee.email, employee.phone, employee.profile?.position, employee.position, roleLabel(employee.role), stationName(employee.stationId)]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [employees, stationId, statusFilter, query, stations]);

  const stationOptions = [
    { value: "all", label: `${ar ? "كل المحطات" : "All stations"} (${employees.length})` },
    ...stations.map((station) => {
      const count = employees.filter((e) => e.stationId === station.id).length;
      return { value: station.id, label: count ? `${station.name} (${count})` : station.name };
    }),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-lg font-semibold">{ar ? "الموظفون" : "Employees"}</h1>
        <span className="text-xs text-muted-foreground font-body">{ar ? `${visible.length} موظف` : `${visible.length} employees`}</span>
      </div>

      <EmployeeStatusFilters employees={employees} active={statusFilter} onChange={setStatusFilter} ar={ar} />

      <div className="flex flex-wrap items-center gap-2">
        <MobileSelect
          value={stationId}
          onChange={setStationId}
          options={stationOptions}
          placeholder={ar ? "كل المحطات" : "All stations"}
          className="w-full sm:w-56"
        />
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ar ? "ابحث بالاسم أو المسمى…" : "Search by name or position…"}
            className="w-full rounded-md border border-input py-2 pe-3 ps-9 text-sm font-body"
          />
        </div>
      </div>

      <EmployeeDirectoryTable
        employees={visible}
        stationName={stationName}
        managerName={managerName}
        gradeLabel={gradeLabel}
        ar={ar}
      />
    </div>
  );
}