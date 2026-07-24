import React from "react";
import { getOrgDirectDropMode } from "@/lib/orgDirectDrop";

export default function OrgTreeDropZones({ active, targetId, onDrop, ar }) {
  if (!active) return null;
  return <div data-org-drop data-target-id={targetId} data-drop-mode="auto" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); onDrop(getOrgDirectDropMode(event.currentTarget, event.clientX, event.clientY), event.dataTransfer.getData("text/plain")); }} className="absolute inset-0 z-20 rounded-lg border-2 border-dashed border-accent/70 bg-accent/10 shadow-elevated" title={ar ? "أفلت هنا" : "Drop here"} />;
}