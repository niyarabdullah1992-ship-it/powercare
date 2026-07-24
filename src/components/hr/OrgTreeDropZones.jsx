import React from "react";

export default function OrgTreeDropZones({ active, targetId, onDrop, ar }) {
  if (!active) return null;
  const zones = [
    ["above", ar ? "بين الأصل وهذه" : "Between parent"],
    ["inside", ar ? "تابع لهذه" : "Make child"],
    ["below", ar ? "بعدها" : "Place after"],
  ];
  return <div className="absolute inset-0 z-20 grid grid-rows-3 overflow-hidden rounded-lg border-2 border-accent/70 bg-card/95 shadow-elevated">{zones.map(([mode, label]) => <button key={mode} type="button" data-org-drop data-target-id={targetId} data-drop-mode={mode} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); onDrop(mode, event.dataTransfer.getData("text/plain")); }} className="border-b border-dashed border-accent/50 px-2 text-[10px] font-semibold text-accent last:border-b-0 hover:bg-accent hover:text-accent-foreground">{label}</button>)}</div>;
}