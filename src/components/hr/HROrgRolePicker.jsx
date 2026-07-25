import React from "react";
import { Check, X } from "lucide-react";
import { levelName } from "@/lib/hrLevels";

export default function HROrgRolePicker({ employee, levels, lang, onSelect, onClose }) {
  if (!employee) return null;
  const ar = lang === "ar";
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/45 p-4" onMouseDown={onClose}>
    <div className="w-full max-w-md rounded-xl border border-accent/30 bg-card p-5 shadow-elevated" onMouseDown={(event) => event.stopPropagation()} dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-heading text-xl font-semibold">{ar ? "اختيار دور الموارد البشرية" : "Choose HR role"}</h2><p className="mt-1 text-sm text-muted-foreground">{employee.name}</p></div><button onClick={onClose} className="rounded-md border border-border p-2 hover:bg-muted"><X className="h-4 w-4" /></button></div>
      <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">{levels.filter((level) => level.active !== false).sort((a, b) => a.order - b.order).map((level) => <button key={level.id} onClick={() => onSelect(level.id)} className={`flex w-full items-center justify-between rounded-lg border p-3 text-start ${employee.hrLevelId === level.id ? "border-accent bg-accent/10" : "border-border hover:border-accent/60"}`}><span><b className="block text-sm">{levelName(level, lang)}</b><span className="text-[10px] text-muted-foreground">{level.scope} · {level.role}</span></span>{employee.hrLevelId === level.id && <Check className="h-4 w-4 text-accent" />}</button>)}</div>
    </div>
  </div>;
}