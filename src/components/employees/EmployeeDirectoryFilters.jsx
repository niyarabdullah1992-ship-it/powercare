import React from "react";

// فلاتر دليل الموظفين: القسم، الفرع، الحالة.
export default function EmployeeDirectoryFilters({ ar, departments, branches, value, onChange }) {
  const select = "rounded-md border border-border bg-card px-3 py-2 text-sm";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={value.department} onChange={(e) => onChange({ ...value, department: e.target.value })} className={select}>
        <option value="">{ar ? "كل الأقسام" : "All departments"}</option>
        {departments.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <select value={value.branch} onChange={(e) => onChange({ ...value, branch: e.target.value })} className={select}>
        <option value="">{ar ? "كل الفروع" : "All branches"}</option>
        {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <select value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value })} className={select}>
        <option value="">{ar ? "كل الحالات" : "All statuses"}</option>
        <option value="active">{ar ? "على رأس العمل" : "Active"}</option>
        <option value="leave">{ar ? "إجازة" : "On leave"}</option>
        <option value="notice">{ar ? "تحت الإشعار" : "Under notice"}</option>
      </select>
    </div>
  );
}