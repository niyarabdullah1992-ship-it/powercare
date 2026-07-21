import React, { useState } from "react";
import { Link } from "react-router-dom";
import MobileSelect from "@/components/mobile/MobileSelect";
import GradeBadge from "@/components/employees/GradeBadge";
import { employeeJobGrade, orderedJobGrades } from "@/lib/jobGrades";
import { visibleEmployees } from "@/lib/permissions";

export default function GradeEmployeeFilter({ data, currentUser, ar }) {
  const [gradeId, setGradeId] = useState("all"); const grades = orderedJobGrades(data);
  const employees = visibleEmployees(currentUser, data).filter((employee) => gradeId === "all" || employee.profile?.gradeId === gradeId);
  return <section className="space-y-3 rounded-xl border border-border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-heading text-lg font-semibold">{ar ? "الموظفون حسب المستوى" : "Employees by Grade"}</h2><MobileSelect value={gradeId} onChange={setGradeId} className="min-w-48" options={[{ value: "all", label: ar ? "كل المستويات" : "All grades" }, ...grades.map((grade) => ({ value: grade.id, label: `${grade.gradeNumber} · ${grade.title}` }))]}/></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{employees.map((employee) => <Link key={employee.id} to={`/app/employees/${employee.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 hover:bg-muted"><span className="truncate text-sm font-medium">{employee.name}</span><GradeBadge grade={employeeJobGrade(employee, data)}/></Link>)}</div></section>;
}