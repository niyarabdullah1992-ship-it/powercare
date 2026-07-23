import React from "react";
import { Flag, Plus } from "lucide-react";

export default function ComplaintEscalationBadge({ level, canManage, ar, onToggle }) {
  if (!level && !canManage) return null;
  const label = level ? (ar ? `شكوى ${level}` : `Complaint ${level}`) : (ar ? "إضافة للتصعيد" : "Add to escalation");
  const help = level
    ? (ar ? `المستوى ${level} في تصعيد الشكاوى؛ المستوى 1 يستلم أولًا ثم ينتقل لما بعده.` : `Complaint escalation level ${level}; level 1 receives first, then it moves upward.`)
    : (ar ? "إضافة هذا الشخص إلى مسار تصعيد الشكاوى" : "Add this person to the complaint escalation path");
  return <button type="button" disabled={!canManage} title={help} aria-label={help} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); if (canManage) onToggle(); }} className={`absolute -end-2 -top-2 z-10 flex h-7 items-center gap-1 rounded-full border px-2 text-[9px] font-bold shadow-md disabled:cursor-help ${level ? "border-accent bg-accent text-accent-foreground" : "border-dashed border-accent/60 bg-card text-accent"}`}>
    {level ? <Flag className="h-3 w-3" /> : <Plus className="h-3 w-3" />}{level ? label : <span className="hidden xl:inline">{label}</span>}
  </button>;
}