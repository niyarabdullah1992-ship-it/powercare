import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { X } from "lucide-react";
import { timeToMinutes, minutesToPercent } from "@/lib/scheduleTime";

export default function ShiftChip({ shift, index, canManage, onRemove }) {
  const start = timeToMinutes(shift.start);
  const end = timeToMinutes(shift.end);
  const left = minutesToPercent(start);
  const width = Math.max(minutesToPercent(end - start), 5);

  return (
    <Draggable draggableId={shift.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style, left: `${left}%`, width: `${width}%` }}
          className={`absolute top-1.5 h-7 rounded-md bg-gradient-to-b from-landing-gold-light to-landing-gold flex items-center justify-center gap-1 px-2 text-[11px] font-body font-medium text-white shadow-sm cursor-grab ${
            snapshot.isDragging ? "z-30 shadow-lg" : "z-10"
          }`}
        >
          <span className="truncate" title={(shift.employeeNames || []).join(", ")}>
            {shift.employeeNames?.length ? `${shift.employeeNames.join(", ")} — ` : ""}
            {shift.label ? `(${shift.label} — ${shift.start}–${shift.end})` : `${shift.start}–${shift.end}`}
          </span>
          {canManage && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="shrink-0 hover:opacity-70"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </Draggable>
  );
}