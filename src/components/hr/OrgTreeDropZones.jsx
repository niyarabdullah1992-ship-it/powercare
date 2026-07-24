import React from "react";

export default function OrgTreeDropZones({ active, targetId, onDrop, ar }) {
  if (!active) return null;
  const zones = [
    ["above", ar ? "بين الأصل والفرع" : "Between parent and branch", "col-span-2"],
    ["visual-left", ar ? "يسار" : "Left", "col-start-1"],
    ["visual-right", ar ? "يمين" : "Right", "col-start-2"],
    ["inside", ar ? "تحت الموظفين" : "Under employees", "col-span-2"],
  ];
  return <div dir="ltr" className="absolute inset-0 z-20 grid grid-cols-2 grid-rows-3 overflow-hidden rounded-lg border-2 border-accent/70 bg-card/95 shadow-elevated">{zones.map(([mode, label, position]) => <button key={mode} type="button" data-org-drop data-target-id={targetId} data-drop-mode={mode} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); onDrop(mode, event.dataTransfer.getData("text/plain")); }} className={`${position} border border-dashed border-accent/50 px-2 text-[10px] font-semibold text-accent hover:bg-accent hover:text-accent-foreground`}>{label}</button>)}</div>;
}