import React from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { GripVertical, MapPinned } from "lucide-react";

function ClusterColumn({ id, title, stations, ar }) {
  return <Droppable droppableId={id}>{(provided, snapshot) => <section ref={provided.innerRef} {...provided.droppableProps} className={`w-64 shrink-0 rounded-xl border p-3 ${snapshot.isDraggingOver ? "border-accent bg-accent/10" : "border-border bg-muted/30"}`}><h4 className="mb-2 text-xs font-semibold">{title}</h4><div className="space-y-2">{stations.map((station, index) => <Draggable key={station.id} draggableId={`station:${station.id}`} index={index}>{(drag) => <div ref={drag.innerRef} {...drag.draggableProps} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5 text-xs shadow-sm"><span {...drag.dragHandleProps}><GripVertical className="h-4 w-4 text-muted-foreground" /></span><MapPinned className="h-4 w-4 text-accent" /><span className="truncate">{station.name}</span></div>}</Draggable>)}{provided.placeholder}{!stations.length && <p className="rounded-lg border border-dashed p-3 text-center text-[10px] text-muted-foreground">{ar ? "اسحب محطة هنا" : "Drop a station here"}</p>}</div></section>}</Droppable>;
}

export default function HierarchyStationBoard({ stations, clusters, stationCluster, lang }) {
  const ar = lang === "ar";
  return <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{ar ? "المجموعات والمحطات" : "Clusters & stations"}</p><div className="flex gap-3 overflow-x-auto pb-2"><ClusterColumn id="cluster:unassigned" title={ar ? "محطات بدون مجموعة" : "Unassigned stations"} stations={stations.filter((station) => !stationCluster(station.id))} ar={ar} />{clusters.map((cluster) => <ClusterColumn key={cluster.id} id={`cluster:${cluster.id}`} title={cluster.name} stations={stations.filter((station) => stationCluster(station.id)?.id === cluster.id)} ar={ar} />)}</div></div>;
}