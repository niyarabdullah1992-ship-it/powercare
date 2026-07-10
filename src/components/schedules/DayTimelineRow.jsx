import React, { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { useI18n } from "@/lib/i18n";
import { Plus } from "lucide-react";
import ShiftChip from "@/components/schedules/ShiftChip";
import AddShiftPopover from "@/components/schedules/AddShiftPopover";
import { HOUR_TICKS } from "@/lib/scheduleTime";
import { addShift, removeShift } from "@/lib/store";

export default function DayTimelineRow({ companyId, stationId, day, dayLabel, shifts, canManage, employees }) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);

  const handleSave = (shift) => {
    addShift(companyId, stationId, day, shift);
    setAdding(false);
  };

  return (
    <div className="relative p-4 rounded-xl border border-landing-gold/25 bg-landing-gold-light/10">
      <h3 className="font-heading text-xl font-semibold text-foreground mb-3">{dayLabel}</h3>
      <div className="flex items-center gap-3">
        <Droppable droppableId={`day-${day}`} direction="horizontal">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="relative flex-1 h-16 rounded-lg bg-landing-gold-light/25">
              {shifts.map((sh, i) => (
                <ShiftChip key={sh.id} shift={sh} index={i} canManage={canManage} onRemove={() => removeShift(companyId, stationId, day, sh.id)} />
              ))}
              {provided.placeholder}
              <div className="absolute inset-x-0 bottom-1 flex justify-between px-1.5 text-[10px] text-muted-foreground font-body">
                {HOUR_TICKS.map((h) => (
                  <span key={h}>{String(h).padStart(2, "0")}:00</span>
                ))}
              </div>
            </div>
          )}
        </Droppable>
        {canManage && (
          <div className="relative shrink-0">
            <button onClick={() => setAdding((o) => !o)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-b from-landing-gold-light to-landing-gold text-white text-xs font-body font-medium whitespace-nowrap">
              <Plus className="w-3.5 h-3.5" /> {t("addShift")}
            </button>
            {adding && <AddShiftPopover onSave={handleSave} onCancel={() => setAdding(false)} employees={employees} />}
          </div>
        )}
      </div>
    </div>
  );
}