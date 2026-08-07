import React from "react";
import { MapPin } from "lucide-react";
import SmartDepartmentGrid from "@/components/hr/SmartDepartmentGrid";
import StationManagerField from "@/components/hr/StationManagerField";
import PermissionTemplatePicker from "@/components/hr/PermissionTemplatePicker";
import { grantedCount } from "@/lib/permissionTemplates";

export default function OrgTreeCreateFields({ type, setType, form, setForm, title, setTitle, permissions, setPermissions, stations, employees, ar, data, companyId, templateId, onTemplate, hasParent, customized, ownerMode, grantable, derivedStation, titleSuggestions = [] }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const granted = grantedCount(permissions);
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
          <div className="sm:col-span-2"><StationManagerField value={form.managerId} onChange={(value) => update("managerId", value)} employees={employees} ar={ar} /></div>
        </div>
      ) : (
        <>
          <input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder={ar ? "البريد الإلكتروني" : "Email address"} className="w-full rounded-md border px-3 py-2 text-sm" />
          <div>
            <input required value={title} list="org-title-suggestions" onChange={(event) => setTitle(event.target.value)} placeholder={ar ? "المسمى الوظيفي — إلزامي" : "Job title — required"} className="w-full rounded-md border px-3 py-2 text-sm" />
            <datalist id="org-title-suggestions">{titleSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}</datalist>
          </div>
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
            <p className="flex items-center gap-1.5 font-semibold"><MapPin className="h-3.5 w-3.5 text-accent" />{derivedStation?.name || (ar ? "على مستوى الشركة" : "Company level")}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{ar ? "المحطة والتصعيد مشتقان من موضع العقدة في الشجرة — لا حقل منفصل لهما" : "Station and escalation are derived from the node position in the tree"}</p>
          </div>
          <PermissionTemplatePicker data={data} companyId={companyId} value={templateId} onSelect={onTemplate} hasParent={hasParent} permissions={permissions} customized={customized} ar={ar} />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground"><span>{ar ? "الأقسام والصلاحيات" : "Sections and access"}</span><span>{granted} {ar ? "قسمًا ممنوحًا" : "granted"}</span></div>
          <SmartDepartmentGrid permissions={permissions} onChange={setPermissions} ar={ar} ownerMode={ownerMode} grantable={grantable} />
          <p className="text-[10px] text-muted-foreground">{ar ? "«إدارة كاملة» تعني إدارة داخل نطاق العقدة لا نطاق الشركة — النطاق يأتي من موضع العقدة، والصلاحية تأتي من هذا الجدول." : "\"Manage\" means managing within the node scope, not the company: scope comes from the node position, access from this grid."}</p>
        </>
      )}
    </>
  );
}