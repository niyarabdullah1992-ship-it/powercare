import React from "react";
import SmartDepartmentGrid from "@/components/hr/SmartDepartmentGrid";
import StationManagerField from "@/components/hr/StationManagerField";
import PermissionTemplatePicker from "@/components/hr/PermissionTemplatePicker";
import { grantedCount } from "@/lib/permissionTemplates";

export default function OrgTreeNodeFields({ type, setType, refId, setRefId, title, setTitle, stationName, setStationName, managerId, setManagerId, permissions, setPermissions, employees, stations, usedEmployees, editing, ar, data, companyId, templateId, onTemplate, hasParent, customized, ownerMode, grantable, titleSuggestions = [] }) {
  const choices = type === "employee" ? employees.filter((employee) => editing || !usedEmployees.includes(employee.id)) : stations;
  return <>
    {!editing && <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setType("station"); setRefId(""); }} className={`rounded-md border p-3 text-sm ${type === "station" ? "border-accent bg-accent/10" : "border-border"}`}>{ar ? "محطة / فرع / مقر" : "Station / branch / HQ"}</button><button type="button" onClick={() => { setType("employee"); setRefId(""); }} className={`rounded-md border p-3 text-sm ${type === "employee" ? "border-accent bg-accent/10" : "border-border"}`}>{ar ? "موظف" : "Employee"}</button></div>}
    <select value={refId} disabled={editing} onChange={(event) => setRefId(event.target.value)} required className="w-full rounded-md border px-3 py-2 text-sm"><option value="">{type === "employee" ? (ar ? "اختر الموظف" : "Select employee") : (ar ? "اختر المحطة أو الفرع" : "Select station or branch")}</option>{choices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    {type === "station" && editing && <><input value={stationName} onChange={(event) => setStationName(event.target.value)} required placeholder={ar ? "اسم المحطة" : "Station name"} className="w-full rounded-md border px-3 py-2 text-sm" /><StationManagerField value={managerId} onChange={setManagerId} employees={employees} ar={ar} /></>}
    <div>
      <input value={title} list="org-title-suggestions" onChange={(event) => setTitle(event.target.value)} required placeholder={type === "employee" ? (ar ? "المسمى الوظيفي — إلزامي" : "Job title — required") : (ar ? "وصف العقدة" : "Node label")} className="w-full rounded-md border px-3 py-2 text-sm" />
      <datalist id="org-title-suggestions">{titleSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}</datalist>
    </div>
    {type === "employee" && <>
      <PermissionTemplatePicker data={data} companyId={companyId} value={templateId} onSelect={onTemplate} hasParent={hasParent} permissions={permissions} customized={customized} ar={ar} />
      <div className="flex items-center justify-between text-[11px] text-muted-foreground"><span>{ar ? "الأقسام والصلاحيات" : "Sections and access"}</span><span>{grantedCount(permissions)} {ar ? "قسمًا ممنوحًا" : "granted"}</span></div>
      <SmartDepartmentGrid permissions={permissions} onChange={setPermissions} ar={ar} ownerMode={ownerMode} grantable={grantable} />
    </>}
  </>;
}