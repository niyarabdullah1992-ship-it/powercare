import React from "react";

export default function OrgTreeDropZones({ active, targetId, onDrop, ar }) {
  if (!active) return null;
  const drop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const mode = event.clientX < rect.left + rect.width / 2 ? "visual-left" : "visual-right";
    onDrop(mode, event.dataTransfer.getData("text/plain"));
  };
  return <div data-org-drop data-target-id={targetId} data-drop-mode="reorder" onDragOver={(event) => event.preventDefault()} onDrop={drop} className="absolute inset-0 z-20 flex items-center justify-center rounded-lg border-2 border-dashed border-accent bg-card/90 px-3 text-center text-[10px] font-semibold text-accent shadow-elevated">{ar ? "أفلت لإعادة الترتيب" : "Drop to reorder"}</div>;
}