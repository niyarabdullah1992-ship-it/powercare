import React from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import SmartPositionCard from "@/components/hr/SmartPositionCard";
import { rankLabel } from "@/lib/smartPositions";

export default function SmartRankLane({ rank, items, ar, onEdit, canManage }) {
  if (!items.length) return null;
  return <div><div className="mx-auto h-7 w-px bg-accent/40" /><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{rankLabel(rank, ar)}</p><Droppable droppableId={rank} direction="horizontal">{(drop) => <div ref={drop.innerRef} {...drop.droppableProps} className="relative flex flex-wrap justify-center gap-4 border-t border-accent/30 pt-5">{items.map(({ position, employee }, index) => <Draggable key={position.employeeId} draggableId={`smart-${position.employeeId}`} index={index} isDragDisabled={!canManage}>{(drag, state) => <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps} className={state.isDragging ? "z-20 opacity-90" : ""}><SmartPositionCard position={position} employee={employee} ar={ar} canDrag={canManage} onClick={() => onEdit(position)} /></div>}</Draggable>)}{drop.placeholder}</div>}</Droppable></div>;
}