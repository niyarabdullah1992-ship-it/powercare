import React, { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { UserRound, BriefcaseBusiness, Plus, Check, X } from "lucide-react";
import HierarchyEmployeeCard from "@/components/hr/HierarchyEmployeeCard";
import { levelName } from "@/lib/hrLevels";

function DropColumn({ id, title, employees, summary = [], onUpdatePosition, onAdd, ar, icon: Icon = UserRound }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", position: "" });
  const submit = () => {
    if (!draft.name.trim()) return;
    onAdd?.({ name: draft.name.trim(), position: draft.position.trim() });
    setDraft({ name: "", position: "" });
    setAdding(false);
  };
  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <section ref={provided.innerRef} {...provided.droppableProps} className={`group/column w-64 shrink-0 rounded-xl border p-3 ${snapshot.isDraggingOver ? "border-accent bg-accent/10" : "border-border bg-muted/30"}`}>
          <div className="mb-2 flex items-center gap-2">
            <h4 className="flex min-w-0 flex-1 items-center gap-2 truncate text-xs font-semibold"><Icon className="h-4 w-4 shrink-0 text-accent" />{title}</h4>
            {onAdd && <button onClick={() => setAdding(true)} className="text-accent opacity-0 group-hover/column:opacity-100"><Plus className="h-4 w-4" /></button>}
          </div>
          {adding && <div className="mb-2 space-y-1 rounded-lg border bg-card p-2"><input autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={ar ? "اسم الموظف" : "Employee name"} className="w-full border px-2 py-1 text-xs" /><input value={draft.position} onChange={(event) => setDraft({ ...draft, position: event.target.value })} onKeyDown={(event) => event.key === "Enter" && submit()} placeholder={ar ? "المنصب" : "Position"} className="w-full border px-2 py-1 text-xs" /><div className="flex justify-end gap-1"><button onClick={submit} className="text-accent"><Check className="h-4 w-4" /></button><button onClick={() => setAdding(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button></div></div>}
          {summary.length > 0 && <p className="mb-2 truncate text-[10px] text-muted-foreground">{summary.join("، ")}</p>}
          <div className="space-y-2">{employees.map((employee, index) => <HierarchyEmployeeCard key={employee.id} employee={employee} index={index} onUpdatePosition={onUpdatePosition} ar={ar} />)}{provided.placeholder}{!employees.length && <p className="rounded-lg border border-dashed p-3 text-center text-[10px] text-muted-foreground">{ar ? "اسحب هنا" : "Drop here"}</p>}</div>
        </section>
      )}
    </Droppable>
  );
}

export default function HierarchyPeopleBoard({ people, managers, levels, stations, onUpdatePosition, onQuickAdd, lang }) {
  const ar = lang === "ar";
  const under = (managerId) => people.filter((employee) => employee.profile?.directManagerId === managerId);
  const unassigned = people.filter((employee) => !employee.profile?.directManagerId || !managers.some((manager) => manager.id === employee.profile.directManagerId));
  return <div className="space-y-4"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{ar ? "المدير المباشر" : "Direct reporting"}</p><div className="flex gap-3 overflow-x-auto pb-2"><DropColumn id="people:unassigned" title={ar ? "غير مرتبطين" : "Unassigned"} employees={unassigned} onUpdatePosition={onUpdatePosition} ar={ar} />{managers.map((manager) => <DropColumn key={manager.id} id={`manager:${manager.id}`} title={manager.name} employees={under(manager.id)} onUpdatePosition={onUpdatePosition} onAdd={(values) => onQuickAdd({ ...values, managerId: manager.id, stationId: manager.stationId || manager.managedStations?.[0] || stations?.[0]?.id })} ar={ar} />)}</div></div>
    <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{ar ? "المناصب الإدارية" : "Administrative positions"}</p><div className="flex gap-3 overflow-x-auto pb-2">{levels.map((level) => <DropColumn key={level.id} id={`position:${level.id}`} title={levelName(level, lang)} employees={[]} summary={people.filter((employee) => employee.hrLevelId === level.id).map((employee) => employee.name)} onUpdatePosition={onUpdatePosition} ar={ar} icon={BriefcaseBusiness} />)}</div></div>
  </div>;
}