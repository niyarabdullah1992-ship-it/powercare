import React from "react";
import { Eye, EyeOff, Settings } from "lucide-react";
import { SMART_DEPARTMENTS } from "@/lib/smartPositions";

const choices = (ar) => [
  { value: "hidden", label: ar ? "مخفي" : "Hidden", icon: EyeOff },
  { value: "view", label: ar ? "عرض فقط" : "View", icon: Eye },
  { value: "manage", label: ar ? "إدارة كاملة" : "Manage", icon: Settings },
];

export default function SmartDepartmentGrid({ permissions, onChange, ar, disabled = false }) {
  const setAccess = (id, access) => { const next = { ...permissions }; if (access === "hidden") delete next[id]; else next[id] = access; onChange(next); };
  return <div className="grid gap-2 sm:grid-cols-2">{SMART_DEPARTMENTS.map((department) => {
    const access = permissions[department.id] || "hidden";
    return <div key={department.id} className={`rounded-lg border p-2.5 ${access !== "hidden" ? "border-accent/50 bg-accent/5" : "border-border bg-muted/20"}`}><p className="text-xs font-semibold">{ar ? department.ar : department.en}</p><div className="mt-2 grid grid-cols-3 gap-1">{choices(ar).map((choice) => <button key={choice.value} type="button" disabled={disabled} onClick={() => setAccess(department.id, choice.value)} className={`flex items-center justify-center gap-1 rounded px-1 py-1.5 text-[9px] ${access === choice.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}><choice.icon className="h-3 w-3" />{choice.label}</button>)}</div></div>;
  })}</div>;
}