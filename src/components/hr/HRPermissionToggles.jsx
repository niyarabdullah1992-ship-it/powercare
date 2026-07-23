import React from "react";
import { HR_PERMISSIONS, hrPermLabel } from "@/lib/hrPermissions";

export default function HRPermissionToggles({ value, onChange, lang }) {
  const toggle = (permission) => onChange(value.includes(permission) ? value.filter((item) => item !== permission) : [...value, permission]);
  return <div className="grid max-h-44 grid-cols-1 gap-1.5 overflow-auto sm:grid-cols-2">{HR_PERMISSIONS.map((permission) => {
    const active = value.includes(permission);
    return <button key={permission} type="button" onClick={() => toggle(permission)} className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-start text-[11px] ${active ? "border-green-500/40 bg-green-500/10 text-green-700" : "border-border bg-muted/30 text-muted-foreground"}`}><span>{hrPermLabel(permission, lang)}</span><span className={`h-4 w-7 rounded-full p-0.5 ${active ? "bg-green-500" : "bg-muted-foreground/30"}`}><span className={`block h-3 w-3 rounded-full bg-card transition-transform ${active ? "translate-x-3 rtl:-translate-x-3" : ""}`} /></span></button>;
  })}</div>;
}