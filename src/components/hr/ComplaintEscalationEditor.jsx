import React, { useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { updateCompany } from "@/lib/store";

export default function ComplaintEscalationEditor({ data, companyId, canManage, lang }) {
  const ar = lang === "ar";
  const eligible = useMemo(() => (data.smartPositions || []).filter((p) => p.permissions?.complaints === "manage").map((p) => ({ ...p, employee: data.employees.find((e) => e.id === p.employeeId) })).filter((p) => p.employee), [data.smartPositions, data.employees]);
  const [chain, setChain] = useState(data.complaintEscalationChain || []);
  const [selected, setSelected] = useState("");
  useEffect(() => setChain((data.complaintEscalationChain || []).filter((id) => eligible.some((p) => p.employeeId === id))), [data.complaintEscalationChain, eligible]);
  const rows = chain.map((id) => eligible.find((p) => p.employeeId === id)).filter(Boolean);
  const available = eligible.filter((p) => !chain.includes(p.employeeId));
  const add = () => { if (selected) { setChain([...chain, selected]); setSelected(""); } };
  const move = ({ source, destination }) => { if (!destination) return; const next = [...chain]; const [item] = next.splice(source.index, 1); next.splice(destination.index, 0, item); setChain(next); };
  const save = () => updateCompany(companyId, (d) => {
    d.complaintEscalationChain = chain;
    [...(d.anonymousReports || []), ...(d.publicReports || [])].filter((r) => r.status === "open").forEach((r) => { r.escalationLevel = Math.min(r.escalationLevel || 0, chain.length - 1); });
  });
  return <section className="rounded-xl border border-accent/30 bg-card p-4" dir={ar ? "rtl" : "ltr"}><div><h3 className="font-heading text-lg font-semibold">{ar ? "مسار تصعيد الشكاوى" : "Complaint escalation path"}</h3><p className="text-xs text-muted-foreground">{ar ? "حدد المستلمين يدويًا؛ يبدأ التصعيد من الرقم 1." : "Choose recipients manually; escalation starts at number 1."}</p></div>
    <DragDropContext onDragEnd={move}><Droppable droppableId="complaint-escalation">{(drop) => <div ref={drop.innerRef} {...drop.droppableProps} className="mt-4 space-y-2">{rows.map((row, index) => <Draggable key={row.employeeId} draggableId={`escalation-${row.employeeId}`} index={index} isDragDisabled={!canManage}>{(drag) => <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps} className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2"><GripVertical className="h-4 w-4 text-muted-foreground" /><span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">{index + 1}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{row.employee.name}</span><span className="block truncate text-[10px] text-muted-foreground">{row.title}</span></span>{canManage && <button type="button" onClick={() => setChain(chain.filter((id) => id !== row.employeeId))} className="p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>}</div>}</Draggable>)}{drop.placeholder}{!rows.length && <p className="py-3 text-center text-xs text-muted-foreground">{ar ? "لم يتم تحديد مسار بعد" : "No path selected yet"}</p>}</div>}</Droppable></DragDropContext>
    {canManage && <div className="mt-4 flex flex-wrap gap-2"><select value={selected} onChange={(e) => setSelected(e.target.value)} className="min-w-56 flex-1 rounded-md border px-3 py-2 text-sm"><option value="">{ar ? "اختر موظفًا من الشجرة" : "Choose a tree employee"}</option>{available.map((p) => <option key={p.employeeId} value={p.employeeId}>{p.employee.name} — {p.title}</option>)}</select><button type="button" onClick={add} disabled={!selected} className="flex items-center gap-1 rounded-md border px-3 py-2 text-xs disabled:opacity-40"><Plus className="h-4 w-4" />{ar ? "إضافة" : "Add"}</button><button type="button" onClick={save} disabled={!chain.length} className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40">{ar ? "حفظ المسار" : "Save path"}</button></div>}
  </section>;
}