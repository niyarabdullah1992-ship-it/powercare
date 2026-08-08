import React, { useState } from "react";
import { Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { stationIdForTreeEmployee } from "@/lib/orgTree";
import { isOnLeaveToday } from "@/lib/leaveTypes";
import PageHeader from "@/components/PageHeader";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";
import EmployeeDirectoryFilters from "@/components/employees/EmployeeDirectoryFilters";
import EmployeeDirectoryTable from "@/components/employees/EmployeeDirectoryTable";

export default function Employees() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data } = useAuth();
  const [filters, setFilters] = useState({ department: "", branch: "", status: "" });

  const stations = data?.stations || [];
  const branchName = (id) => stations.find((station) => station.id === id)?.name || "";

  const allRows = (data?.employees || []).map((employee) => {
    const profile = employee.profile || {};
    const stationId = stationIdForTreeEmployee(data, employee.id) || employee.stationId || "";
    const statusKey = profile.offboarding || employee.offboarding ? "notice" : isOnLeaveToday(employee) ? "leave" : "active";
    return {
      id: employee.id,
      name: employee.name,
      avatarUrl: profile.avatarUrl,
      jobNumber: profile.jobNumber,
      department: profile.department,
      position: profile.position,
      stationId,
      branch: branchName(stationId),
      statusKey,
      statusLabel: ar
        ? { active: "على رأس العمل", leave: "إجازة", notice: "تحت الإشعار" }[statusKey]
        : { active: "Active", leave: "On leave", notice: "Under notice" }[statusKey],
    };
  });

  const rows = allRows.filter((row) =>
    (!filters.department || row.department === filters.department) &&
    (!filters.branch || row.stationId === filters.branch) &&
    (!filters.status || row.statusKey === filters.status)
  );

  const departments = [...new Set(allRows.map((row) => row.department).filter(Boolean))];

  return (
    <div className="space-y-5">
      <PageHeader
        title={ar ? "الموظفون" : "Employees"}
        description={`${rows.length} ${ar ? "موظف" : "employees"}`}
        icon={Users}
        actions={
          <ComparisonExportButtons
            title={ar ? "الموظفون" : "Employees"}
            headers={[ar ? "الموظف" : "Employee", ar ? "الرقم الوظيفي" : "Job number", ar ? "القسم" : "Department", ar ? "المسمى الوظيفي" : "Job title", ar ? "الفرع" : "Branch", ar ? "الحالة" : "Status"]}
            rows={rows.map((row) => [row.name, row.jobNumber || "—", row.department || "—", row.position || "—", row.branch || "—", row.statusLabel])}
          />
        }
      />

      <EmployeeDirectoryFilters ar={ar} departments={departments} branches={stations} value={filters} onChange={setFilters} />

      <EmployeeDirectoryTable rows={rows} ar={ar} />
    </div>
  );
}