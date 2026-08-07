import React from "react";
import { Network } from "lucide-react";

export default function TreeCommunicationTargetPicker({ targets, value, onChange, ar }) {
  if (!targets.length) return <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{ar ? "لا يوجد مسؤول أعلى بصلاحية التواصل في الشجرة." : "No higher communication manager is configured in the tree."}</p>;
  return <label className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
    <Network className="h-4 w-4 shrink-0 text-accent" />
    <span className="shrink-0">{ar ? "إرسال عبر الشجرة إلى:" : "Send through the tree to:"}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 rounded-md border border-input bg-card px-2 py-1.5 text-foreground">
      {targets.map((target) => <option key={target.id} value={target.id}>{target.name}{target.title ? ` — ${target.title}` : ""}</option>)}
    </select>
  </label>;
}