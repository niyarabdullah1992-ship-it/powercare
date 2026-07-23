import React from "react";

const positions = {
  above: "col-start-2 row-start-1",
  left: "col-start-1 row-start-2",
  right: "col-start-3 row-start-2",
  inside: "col-start-2 row-start-2",
  below: "col-start-2 row-start-3",
};

export default function OrgTreeDropZones({ active, targetId, allowedModes = [], onDrop, ar }) {
  if (!active) return null;
  const zones = [
    ["above", ar ? "أعلى" : "Above"],
    ["left", ar ? "يسار" : "Left"],
    ["right", ar ? "يمين" : "Right"],
    ["inside", ar ? "تابع" : "Inside"],
    ["below", ar ? "أسفل" : "Below"],
  ];
  return <div className="absolute inset-0 z-20 grid grid-cols-3 grid-rows-3 gap-1 rounded-lg bg-card/95 p-1 shadow-elevated">{zones.map(([mode, label]) => {
    const allowed = allowedModes.includes(mode);
    return <button key={mode} type="button" disabled={!allowed} {...(allowed ? { "data-org-drop": "", "data-target-id": targetId, "data-drop-mode": mode } : {})} onDragOver={(event) => { if (allowed) event.preventDefault(); }} onDrop={(event) => { if (!allowed) return; event.preventDefault(); event.stopPropagation(); onDrop(mode); }} className={`min-h-9 rounded border border-dashed px-1 text-[9px] font-semibold ${allowed ? "border-accent bg-accent/20 text-accent hover:bg-accent hover:text-accent-foreground" : "cursor-not-allowed border-destructive/70 bg-destructive/15 text-destructive opacity-80"} ${positions[mode]}`}>{label}</button>;
  })}</div>;
}