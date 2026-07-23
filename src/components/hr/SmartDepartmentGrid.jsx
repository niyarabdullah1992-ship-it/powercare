import React from "react";
import { Check } from "lucide-react";
import { SMART_DEPARTMENTS } from "@/lib/smartPositions";

export default function SmartDepartmentGrid({ permissions, onChange, ar, disabled = false }) {
  const setDepartment = (id, enabled) => { const next = { ...permissions }; if (enabled) next[id] = "view"; else delete next[id]; onChange(next); };
  const setAccess = (id, access) => onChange({ ...permissions, [id]: access });
  return <div className="grid gap-2 sm:grid-cols-2">{SMART_DEPARTMENTS.map((department) => {
    const access = permissions[department.id];
    return <div key={department.id} className={`rounded-lg border p-2.5 ${access ? "border-accent/50 bg-accent/5" : "border-border bg-muted/20"}`}><button type="button" disabled={disabled} onClick={() => setDepartment(department.id, !access)} className="flex w-full items-center gap-2 text-start text-xs font-semibold disabled:cursor-default"><span className={`flex h-5 w-5 items-center justify-center rounded border ${access ? "border-accent bg-accent text-accent-foreground" : "border-input"}`}>{access && <Check className="h-3 w-3" />}</span>{ar ? department.ar : department.en}</button>{access && <div className="mt-2 grid grid-cols-2 gap-1"><button type="button" disabled={disabled} onClick={() => setAccess(department.id, "view")} className={`rounded px-2 py-1.5 text-[10px] ${access === "view" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{ar ? "عرض فقط" : "View only"}</button><button type="button" disabled={disabled} onClick={() => setAccess(department.id, "manage")} className={`rounded px-2 py-1.5 text-[10px] ${access === "manage" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{ar ? "إدارة كاملة" : "Full access"}</button></div>}</div>;
  })}</div>;
}