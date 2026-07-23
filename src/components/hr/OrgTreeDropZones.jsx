import React from "react";

export default function OrgTreeDropZones({ active, targetId, onDrop, ar }) {
  if (!active) return null;
  const zones = [
    ["before", ar ? "أعلاه" : "Above"],
    ["child", ar ? "تحته كابن" : "As child"],
    ["after", ar ? "أسفله" : "Below"],
  ];
  return <div className="absolute inset-x-1 top-1/2 z-20 grid -translate-y-1/2 grid-cols-3 gap-1 rounded-md bg-card/95 p-1 shadow-elevated">{zones.map(([mode, label]) => <button key={mode} type="button" data-org-drop data-target-id={targetId} data-drop-mode={mode} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); onDrop(mode); }} className="min-h-12 rounded border border-dashed border-accent bg-accent/10 px-1 text-[9px] font-semibold text-accent hover:bg-accent hover:text-accent-foreground">{label}</button>)}</div>;
}