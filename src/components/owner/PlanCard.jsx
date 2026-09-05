import React from "react";
import { Pencil, Power, Trash2 } from "lucide-react";

export default function PlanCard({ plan, ar, onEdit, onToggle, onDelete }) {
  const name = ar ? plan.nameAr : plan.nameEn;
  return <article className="rounded-xl border border-border bg-card p-4 shadow-soft">
    <div className="flex items-start justify-between gap-3"><div><h3 className="font-heading text-xl font-semibold">{name}</h3><p className="text-xs text-muted-foreground">{plan.slug}</p></div><span className={`rounded-full px-2.5 py-1 text-xs ${plan.active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{plan.active ? (ar ? "مفعّلة" : "Active") : (ar ? "متوقفة" : "Inactive")}</span></div>
    <p className="mt-4 text-sm"><strong>{plan.monthlyPrice} {plan.currency}</strong> / {ar ? "شهر" : "month"} · <strong>{plan.yearlyPrice} {plan.currency}</strong> / {ar ? "سنة" : "year"}</p>
    <p className="mt-2 text-xs text-muted-foreground">{ar ? "الفروع" : "Stations"}: {plan.maxStations ?? (ar ? "غير محدود" : "Unlimited")} · {ar ? "الموظفون" : "Employees"}: {plan.maxEmployees ?? (ar ? "غير محدود" : "Unlimited")} · {(plan.enabledSections || []).length} {ar ? "قسم" : "sections"}</p>
    <div className="mt-4 flex gap-2"><button onClick={onEdit} className="rounded-md border border-border p-2" title={ar ? "تعديل" : "Edit"}><Pencil className="h-4 w-4" /></button><button onClick={onToggle} className="rounded-md border border-border p-2" title={ar ? "تفعيل أو إيقاف" : "Toggle"}><Power className="h-4 w-4" /></button><button onClick={onDelete} className="rounded-md border border-destructive/30 p-2 text-destructive" title={ar ? "حذف" : "Delete"}><Trash2 className="h-4 w-4" /></button></div>
  </article>;
}