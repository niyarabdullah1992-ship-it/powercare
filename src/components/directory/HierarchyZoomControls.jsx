import React from "react";
import { Maximize2, Minus, Plus } from "lucide-react";

export default function HierarchyZoomControls({ zoom, onZoom, onFit, ar }) {
  return <div className="flex items-center gap-1">
    <button type="button" onClick={() => onZoom(-0.1)} className="rounded-md border border-border p-2 hover:bg-muted" aria-label={ar ? "تصغير" : "Zoom out"}><Minus className="h-4 w-4" /></button>
    <span className="min-w-12 text-center text-xs font-semibold">{Math.round(zoom * 100)}%</span>
    <button type="button" onClick={() => onZoom(0.1)} className="rounded-md border border-border p-2 hover:bg-muted" aria-label={ar ? "تكبير" : "Zoom in"}><Plus className="h-4 w-4" /></button>
    <button type="button" onClick={onFit} className="ms-1 flex items-center gap-1.5 rounded-md border border-border px-2.5 py-2 text-xs hover:bg-muted"><Maximize2 className="h-4 w-4" />{ar ? "إظهار الكل" : "Fit all"}</button>
  </div>;
}