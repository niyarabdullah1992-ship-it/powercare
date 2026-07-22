import React, { useRef, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Crown } from "lucide-react";
import { groupLevelsByOrder } from "@/lib/hrLevels";
import HierarchyZoomControls from "@/components/directory/HierarchyZoomControls";
import StationHierarchyBranch from "@/components/directory/StationHierarchyBranch";
import HRAdminTierNode from "@/components/hr/HRAdminTierNode";
import useHierarchyZoomGestures from "@/hooks/useHierarchyZoomGestures";

export default function HRFullHierarchyMap({ data, company, currentUser, stations, employees, t, lang, statusFor = () => "noTasks", onSelectStation, canReorder, onStationDragEnd }) {
  const ar = lang === "ar";
  const hierarchyEmployees = employees || data.employees || [];
  const levels = groupLevelsByOrder(data.hrLevels || []).filter((group) => (group.manager?.active ?? true) || (group.assistant?.active ?? true)).reverse();
  const owner = (data.employees || []).find((employee) => employee.id === data.ownerId) || (data.employees || []).find((employee) => employee.role === "owner" || employee.email === company?.ownerEmail) || currentUser;
  const fitZoom = Math.max(.5, Math.min(1, 3 / Math.max(stations.length, 1)));
  const [customZoom, setCustomZoom] = useState(null);
  const viewportRef = useRef(null);
  const zoom = customZoom ?? fitZoom;
  const setZoom = (value) => setCustomZoom(Math.max(.5, Math.min(1.5, Number(value.toFixed(2)))));
  const gestures = useHierarchyZoomGestures(viewportRef, zoom, setZoom);
  const clusterName = (stationId) => (data.hrClusters || []).find((cluster) => (cluster.stationIds || []).includes(stationId))?.name;
  return (
    <div className="rounded-xl border border-accent/25 bg-muted/30">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-accent/20 bg-card px-4 py-3"><div><p className="text-sm font-semibold">{ar ? "الخريطة الإدارية الكاملة" : "Full administrative map"}</p><p className="text-[11px] text-muted-foreground">{ar ? "المالك والمستويات الإدارية والمجموعات والفروع والموظفون" : "Owner, administrative tiers, groups, stations and employees"}</p></div><HierarchyZoomControls zoom={zoom} onZoom={(change) => setZoom(zoom + change)} onFit={() => setCustomZoom(null)} ar={ar} /></div>
      <div ref={viewportRef} {...gestures} className="overflow-auto p-5 pb-8" style={{ touchAction: "none" }}><div className="mx-auto min-w-max origin-top" style={{ zoom }}>
        <div className="mx-auto w-64 rounded-xl border-2 border-accent bg-primary p-3 text-center text-primary-foreground shadow-elevated"><Crown className="mx-auto h-5 w-5 text-accent" /><p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-primary-foreground/75">{ar ? "المالك" : "Organization owner"}</p><h2 className="truncate font-heading text-base font-semibold">{owner?.name || company?.name}</h2></div>
        {levels.map((group) => <React.Fragment key={group.order}><div className="mx-auto h-6 w-px bg-accent/50" /><div className="flex justify-center"><HRAdminTierNode group={group} employees={hierarchyEmployees} lang={lang} /></div></React.Fragment>)}
        <div className="mx-auto h-8 w-px bg-accent/50" />
        <DragDropContext onDragEnd={onStationDragEnd}><Droppable droppableId="hr-full-hierarchy" direction="horizontal">{(provided) => <div ref={provided.innerRef} {...provided.droppableProps} className="relative flex items-start justify-center gap-5 px-8 pt-8 before:absolute before:inset-x-[7rem] before:top-0 before:border-t-2 before:border-accent/40">{stations.map((station, index) => <Draggable key={station.id} draggableId={station.id} index={index} isDragDisabled={!canReorder}>{(dragProvided, snapshot) => <StationHierarchyBranch station={station} employees={hierarchyEmployees.filter((employee) => (employee.stationId || data.stations?.[0]?.id) === station.id || (employee.managedStations || []).includes(station.id))} owner={owner} company={company} t={t} ar={ar} statusFor={statusFor} onSelect={onSelectStation} canReorder={canReorder} dragProvided={dragProvided} dragging={snapshot.isDragging} clusterName={clusterName(station.id)} />}</Draggable>)}{provided.placeholder}</div>}</Droppable></DragDropContext>
      </div></div>
    </div>
  );
}