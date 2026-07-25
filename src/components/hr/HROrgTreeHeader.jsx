import React from "react";
import { Network } from "lucide-react";
import HierarchyZoomControls from "@/components/directory/HierarchyZoomControls";
import OrgTreeFullscreenButton from "@/components/hr/OrgTreeFullscreenButton";

export default function HROrgTreeHeader({ ar, zoom, setZoom, fit, pan, fullscreen, toggleFullscreen, sectionRef }) {
  return <header className="flex flex-wrap items-center justify-between gap-3 border-b border-accent/20 bg-primary px-4 py-4 text-primary-foreground"><div className="flex items-center gap-3"><span className="rounded-lg bg-accent/15 p-2"><Network className="h-5 w-5 text-accent" /></span><div><h2 className="font-heading text-2xl font-bold !text-white">{ar ? "شجرة الموارد البشرية" : "Human Resources tree"}</h2><p className="text-[11px] text-primary-foreground/70">{ar ? "اسحب موظفي HR بين المحطات والمجموعات والمديرين" : "Drag HR employees between stations, clusters, and managers"}</p></div></div><div className="flex flex-wrap items-center gap-2"><OrgTreeFullscreenButton active={fullscreen} onToggle={toggleFullscreen} targetRef={sectionRef} ar={ar} /><HierarchyZoomControls zoom={zoom} onZoom={(change) => setZoom(zoom + change)} onSetZoom={setZoom} onFit={fit} onPan={pan} ar={ar} /></div></header>;
}