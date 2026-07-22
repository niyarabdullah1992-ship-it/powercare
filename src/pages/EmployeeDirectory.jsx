import React, { useMemo, useState } from "react";
import { ContactRound } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { visibleEmployees, visibleStations } from "@/lib/permissions";
import { SYSTEM_ROLES, getRoleLabel } from "@/lib/roles";
import { orderedJobGrades } from "@/lib/jobGrades";
import useDirectoryTargets from "@/hooks/useDirectoryTargets";
import PageHeader from "@/components/PageHeader";
import DirectoryFilters from "@/components/directory/DirectoryFilters";
import EmployeeHierarchyTree from "@/components/directory/EmployeeHierarchyTree";

export default function EmployeeDirectory() {
  const { data, currentUser, company } = useAuth();
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const targets = useDirectoryTargets(currentUser);
  const [search, setSearch] = useState(""); const [role, setRole] = useState("all"); const [grade, setGrade] = useState("all"); const [station, setStation] = useState("all");
  const stations = data && currentUser ? visibleStations(currentUser, data) : [];
  const employees = data && currentUser ? visibleEmployees(currentUser, data) : [];
  const grades = orderedJobGrades(data);
  const filtered = useMemo(() => employees.filter((employee) => {
    const query = search.trim().toLowerCase();
    return (!query || employee.name?.toLowerCase().includes(query) || employee.email?.toLowerCase().includes(query)) && (role === "all" || employee.role === role) && (grade === "all" || employee.profile?.gradeId === grade);
  }), [employees, search, role, grade]);
  if (!data || !currentUser) return null;
  const defaultStation = data.stations?.[0]?.id;
  const belongsTo = (employee, stationId) => (employee.stationId || defaultStation) === stationId || (["pgm", "station_manager"].includes(employee.role) && (employee.managedStations || []).includes(stationId));
  const shownStations = station === "all" ? stations : stations.filter((item) => item.id === station);
  const statusFor = (employeeId) => { const mine = targets.filter((target) => target.assignment_type === "member" && target.employee_id === employeeId); if (mine.some((target) => target.status === "overdue")) return "overdue"; if (mine.some((target) => target.status === "active")) return "inProgress"; return mine.length ? "completed" : "noTasks"; };
  const roleOptions = [{ value: "all", label: ar ? "كل الأدوار" : "All roles" }, ...SYSTEM_ROLES.map((value) => ({ value, label: getRoleLabel(company, value, t) }))];
  const gradeOptions = [{ value: "all", label: ar ? "كل الدرجات" : "All grades" }, ...grades.map((item) => ({ value: item.id, label: `${item.gradeNumber} · ${item.title}` }))];
  const stationOptions = [{ value: "all", label: ar ? "كل المحطات" : "All stations" }, ...stations.map((item) => ({ value: item.id, label: item.name }))];
  const filtersActive = !!search.trim() || role !== "all" || grade !== "all" || station !== "all";
  const sections = shownStations.map((item) => ({ station: item, employees: filtered.filter((employee) => belongsTo(employee, item.id)) })).filter((section) => !filtersActive || section.employees.length);
  const owner = employees.find((employee) => employee.role === "director") || currentUser;
  return <div className="space-y-6"><PageHeader title={ar ? "دليل الموظفين" : "Employee Directory"} description={ar ? "مخطط هرمي يبدأ بالمالك ثم المحطات والموظفين ضمن نطاق صلاحياتك" : "A hierarchy from the company owner to stations and their employees"} icon={ContactRound} /><DirectoryFilters search={search} onSearch={setSearch} role={role} onRole={setRole} grade={grade} onGrade={setGrade} station={station} onStation={setStation} roles={roleOptions} grades={gradeOptions} stations={stationOptions} ar={ar} />{sections.length ? <EmployeeHierarchyTree sections={sections} owner={owner} company={company} t={t} ar={ar} statusFor={statusFor} /> : <div className="rounded-xl bg-muted py-16 text-center text-sm text-muted-foreground">{ar ? "لا توجد نتائج مطابقة." : "No matching employees."}</div>}</div>;
}