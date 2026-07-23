import React from "react";
import SmartDepartmentGrid from "@/components/hr/SmartDepartmentGrid";

export default function OrgTreeCreateFields({ type, setType, form, setForm, title, setTitle, permissions, setPermissions, stations, ar }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setType("station")} className={`rounded-md border p-3 text-sm ${type === "station" ? "border-accent bg-accent/10" : "border-border"}`}>{ar ? "محطة / فرع / مقر" : "Station / branch / HQ"}</button>
        <button type="button" onClick={() => setType("employee")} className={`rounded-md border p-3 text-sm ${type === "employee" ? "border-accent bg-accent/10" : "border-border"}`}>{ar ? "موظف" : "Employee"}</button>
      </div>
      <input required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder={type === "station" ? (ar ? "اسم المحطة" : "Station name") : (ar ? "اسم الموظف" : "Employee name")} className="w-full rounded-md border px-3 py-2 text-sm" />
      {type === "station" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <input required value={form.location} onChange={(event) => update("location", event.target.value)} placeholder={ar ? "الموقع" : "Location"} className="rounded-md border px-3 py-2 text-sm" />
          <input value={form.stationType} onChange={(event) => update("stationType", event.target.value)} placeholder={ar ? "نوع المحطة" : "Station type"} className="rounded-md border px-3 py-2 text-sm" />
        </div>
      ) : (
        <>
          <input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder={ar ? "البريد الإلكتروني" : "Email address"} className="w-full rounded-md border px-3 py-2 text-sm" />
          <select value={form.stationId} onChange={(event) => update("stationId", event.target.value)} className="w-full rounded-md border px-3 py-2 text-sm"><option value="">{ar ? "بدون محطة" : "No station"}</option>{stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}</select>
          <SmartDepartmentGrid permissions={permissions} onChange={setPermissions} ar={ar} />
          <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder={ar ? "المسمى الوظيفي" : "Job title"} className="w-full rounded-md border px-3 py-2 text-sm" />
        </>
      )}
    </>
  );
}