import React from "react";
import SmartDepartmentGrid from "@/components/hr/SmartDepartmentGrid";
import StationManagerField from "@/components/hr/StationManagerField";

export default function OrgTreeNodeFields({ type, setType, refId, setRefId, title, setTitle, stationName, setStationName, managerId, setManagerId, permissions, setPermissions, employees, stations, usedEmployees, editing, ar }) {
  const choices = type === "employee" ? employees.filter((employee) => editing || !usedEmployees.includes(employee.id)) : stations;
  return <>
    {!editing && <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setType("station"); setRefId(""); }} className={`rounded-md border p-3 text-sm ${type === "station" ? "border-accent bg-accent/10" : "border-border"}`}>{ar ? "محطة / فرع / مقر" : "Station / branch / HQ"}</button><button type="button" onClick={() => { setType("employee"); setRefId(""); }} className={`rounded-md border p-3 text-sm ${type === "employee" ? "border-accent bg-accent/10" : "border-border"}`}>{ar ? "موظف" : "Employee"}</button></div>}
    <select value={refId} disabled={editing} onChange={(event) => setRefId(event.target.value)} required className="w-full rounded-md border px-3 py-2 text-sm"><option value="">{type === "employee" ? (ar ? "اختر الموظف" : "Select employee") : (ar ? "اختر المحطة أو الفرع" : "Select station or branch")}</option>{choices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    {type === "station" && editing && <><input value={stationName} onChange={(event) => setStationName(event.target.value)} required placeholder={ar ? "اسم المحطة" : "Station name"} className="w-full rounded-md border px-3 py-2 text-sm" /><StationManagerField value={managerId} onChange={setManagerId} employees={employees} ar={ar} /></>}
    {type === "employee" && <SmartDepartmentGrid permissions={permissions} onChange={setPermissions} ar={ar} />}
    <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder={type === "employee" ? (ar ? "المسمى الوظيفي" : "Job title") : (ar ? "وصف العقدة" : "Node label")} className="w-full rounded-md border px-3 py-2 text-sm" />
  </>;
}