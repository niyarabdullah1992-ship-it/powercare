import React from "react";
import { Eye, EyeOff, Lock, Settings } from "lucide-react";
import { SMART_DEPARTMENTS } from "@/lib/smartPositions";
import { OWNER_ONLY_DEPARTMENTS } from "@/lib/permissionTemplates";

const choices = (ar) => [
  { value: "hidden", label: ar ? "مخفي" : "Hidden", icon: EyeOff },
  { value: "view", label: ar ? "عرض فقط" : "View", icon: Eye },
  { value: "manage", label: ar ? "إدارة كاملة" : "Manage", icon: Settings },
];

export default function SmartDepartmentGrid({ permissions, onChange, ar, disabled = false, ownerMode = true, grantable = null }) {
  const setAccess = (id, access) => { const next = { ...permissions }; if (access === "hidden") delete next[id]; else next[id] = access; onChange(next); };
  // Two limits: owner-only sections, and never granting more than you hold yourself.
  const allowedAccess = (id) => {
    if (!ownerMode && OWNER_ONLY_DEPARTMENTS.includes(id)) return "hidden";
    if (!grantable) return "manage";
    return grantable[id] || "hidden";
  };
  return <div className="grid gap-2 sm:grid-cols-2">{SMART_DEPARTMENTS.map((department) => {
    const access = permissions[department.id] || "hidden";
    const ceiling = allowedAccess(department.id);
    const locked = ceiling === "hidden";
    return <div key={department.id} className={`rounded-lg border p-2.5 ${locked ? "border-border bg-muted/40 opacity-60" : access !== "hidden" ? "border-accent/50 bg-accent/5" : "border-border bg-muted/20"}`}>
      <p className="flex items-center gap-1 text-xs font-semibold">{ar ? department.ar : department.en}{locked && <Lock className="h-3 w-3 text-muted-foreground" />}</p>
      <div className="mt-2 grid grid-cols-3 gap-1">{choices(ar).map((choice) => {
        const blocked = choice.value === "manage" ? ceiling !== "manage" : choice.value === "view" ? ceiling === "hidden" : false;
        return <button key={choice.value} type="button" disabled={disabled || blocked} onClick={() => setAccess(department.id, choice.value)} className={`flex items-center justify-center gap-1 rounded px-1 py-1.5 text-[9px] disabled:opacity-40 ${access === choice.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}><choice.icon className="h-3 w-3" />{choice.label}</button>;
      })}</div>
      {locked && <p className="mt-1 text-[9px] text-muted-foreground">{ar ? "يمنحه مالك الشركة فقط" : "Granted by the company owner only"}</p>}
    </div>;
  })}</div>;
}