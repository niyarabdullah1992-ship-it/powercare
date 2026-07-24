import React from "react";

const positions = {
  above: "col-start-2 row-start-1",
  left: "col-start-1 row-start-2",
  right: "col-start-3 row-start-2",
  inside: "col-start-2 row-start-2",
  below: "col-start-2 row-start-3",
};

export default function OrgTreeDropZones({ active, targetId, onDrop, ar }) {
  if (!active) return null;
  const zones = [
    ["above", ar ? "بين الأصل وهذه" : "Between parent"],
    ["left", ar ? "يسار" : "Left"],
    ["right", ar ? "يمين" : "Right"],
    ["inside", ar ? "تابع" : "Inside"],
    ["below", ar ? "أسفل" : "Below"],
  ];
  return <div className="absolute inset-0 z-20 grid grid-cols-3 grid-rows-3 gap-1 rounded-lg bg-card/90 p-1 shadow-elevated">{zones.map(([mode, label]) => <button key={mode} type="button" data-org-drop data-target-id={targetId} data-drop-mode={mode} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); onDrop(mode, event.dataTransfer.getData("text/plain")); }} className={`min-h-9 rounded border border-dashed border-accent bg-accent/15 px-1 text-[9px] font-semibold text-accent hover:bg-accent hover:text-accent-foreground ${positions[mode]}`}>{label}</button>)}</div>;
}