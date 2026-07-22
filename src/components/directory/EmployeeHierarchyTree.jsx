import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Crown } from "lucide-react";
import HierarchyZoomControls from "@/components/directory/HierarchyZoomControls";
import StationHierarchyBranch from "@/components/directory/StationHierarchyBranch";

export default function EmployeeHierarchyTree({ sections, owner, company, t, ar, statusFor, onSelectStation, canReorder, onStationDragEnd }) {
  const fitZoom = Math.max(0.5, Math.min(1, 3 / Math.max(sections.length, 1)));
  const [customZoom, setCustomZoom] = useState(null);
  const zoom = customZoom ?? fitZoom;
  const changeZoom = (change) => setCustomZoom(Math.max(0.5, Math.min(1.5, Number((zoom + change).toFixed(2)))));
  return <div className="rounded-2xl border border-accent/20 bg-muted/40">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-accent/15 bg-card px-4 py-3"><div><p className="text-sm font-semibold">{ar ? "خريطة الموظفين والمحطات" : "Employees & stations map"}</p><p className="text-[11px] text-muted-foreground">{ar ? "اضغط على المحطة لإدارتها" : "Select a station to manage it"}</p></div><HierarchyZoomControls zoom={zoom} onZoom={changeZoom} onFit={() => setCustomZoom(null)} ar={ar} /></div>
    <div className="overflow-auto p-4 pb-7 md:p-7"><div className="mx-auto min-w-max origin-top" style={{ zoom }}>
      <div className="mx-auto w-64 rounded-2xl border-2 border-accent bg-primary p-4 text-center text-primary-foreground shadow-elevated"><Crown className="mx-auto h-6 w-6 text-landing-gold-light" /><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70">{ar ? "المالك" : "Company owner"}</p><h2 className="mt-1 truncate font-heading text-lg font-semibold">{owner?.name || company?.name || (ar ? "مالك الشركة" : "Company owner")}</h2></div>
      <div className="mx-auto h-9 w-px bg-accent/60" />
      <DragDropContext onDragEnd={onStationDragEnd || (() => {})}><Droppable droppableId="employees-hierarchy-stations" direction="horizontal">{(provided) => <div ref={provided.innerRef} {...provided.droppableProps} className="relative flex items-start justify-center gap-6 px-8 pt-9 before:absolute before:inset-x-[7rem] before:top-0 before:border-t-2 before:border-accent/40">
        {sections.map(({ station, employees }, index) => <Draggable key={station.id} draggableId={station.id} index={index} isDragDisabled={!canReorder}>{(dragProvided, snapshot) => <StationHierarchyBranch station={station} employees={employees} owner={owner} company={company} t={t} ar={ar} statusFor={statusFor} onSelect={onSelectStation} canReorder={canReorder} dragProvided={dragProvided} dragging={snapshot.isDragging} />}</Draggable>)}{provided.placeholder}
      </div>}</Droppable></DragDropContext>
    </div></div>
  </div>;
}