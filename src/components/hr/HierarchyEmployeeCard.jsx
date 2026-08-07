import React, { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { GripVertical, Pencil, Check, X } from "lucide-react";

export default function HierarchyEmployeeCard({ employee, index, onUpdatePosition, ar }) {
  const [editing, setEditing] = useState(false);
  const [position, setPosition] = useState(employee.profile?.position || employee.position || "");
  const save = () => { onUpdatePosition(employee.id, position.trim()); setEditing(false); };
  return <Draggable draggableId={`employee:${employee.id}`} index={index}>{(provided, snapshot) => (
    <div ref={provided.innerRef} {...provided.draggableProps} className={`group rounded-lg border bg-card p-2.5 shadow-sm ${snapshot.isDragging ? "border-accent shadow-elevated" : "border-border"}`}>
      <div className="flex items-center gap-2">
        <span {...provided.dragHandleProps} className="cursor-grab text-muted-foreground"><GripVertical className="h-4 w-4" /></span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-accent">{employee.name?.charAt(0)}</span>
        <span className="min-w-0 flex-1"><b className="block truncate text-xs">{employee.name}</b><span className="block truncate text-[10px] text-muted-foreground">{employee.profile?.position || employee.position || (ar ? "بدون منصب" : "No position")}</span></span>
        <button onClick={() => setEditing(true)} className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground" title={ar ? "تعديل" : "Edit"}><Pencil className="h-3.5 w-3.5" /></button>
      </div>
      {editing && <div className="mt-2 flex gap-1"><input autoFocus value={position} onChange={(event) => setPosition(event.target.value)} onKeyDown={(event) => event.key === "Enter" && save()} className="min-w-0 flex-1 border px-2 py-1 text-xs" /><button onClick={save} className="text-accent"><Check className="h-4 w-4" /></button><button onClick={() => setEditing(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button></div>}
    </div>
  )}</Draggable>;
}