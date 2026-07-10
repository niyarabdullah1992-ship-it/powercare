import React, { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { GripVertical, Pencil, Check, Trash2, UserPlus, X } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import HRAssignModal from "@/components/hr/HRAssignModal";

export const SIMDIF_NODE_W = 200;

// A single draggable SimDif position node: name, scope, assigned employee, and
// a "reports to" selector that draws the reporting line to its parent.
export default function SimDifNodeCard({ node, nodes, data, canManage, onDrag, onSetParent, onRename, onRemove, onAssignExisting, onHireNew, onUnassign }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(node.name);
  const [assigning, setAssigning] = useState(false);
  const dragState = useRef(null);

  const employee = node.employeeId ? data.employees.find((e) => e.id === node.employeeId) : null;
  const eligible = data.employees.filter((e) => !(nodes || []).some((n) => n.employeeId === e.id));
  const scopeLabel = node.scope === "station" ? t("scopeStation") : node.scope === "cluster" ? t("scopeCluster") : t("scopeGlobal");
  const parentOptions = (nodes || []).filter((n) => n.id !== node.id);

  const onMove = (e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    onDrag(node.id, Math.max(0, dragState.current.origX + dx), Math.max(0, dragState.current.origY + dy));
  };
  const onUp = () => {
    dragState.current = null;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };
  useEffect(() => () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }, []);

  const startDrag = (e) => {
    if (!canManage) return;
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: node.x ?? 40, origY: node.y ?? 40 };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const saveName = () => { if (nameVal.trim()) onRename(nameVal.trim()); setEditing(false); };

  return (
    <div
      className="absolute p-3 rounded-lg border border-border bg-card shadow-sm space-y-2 select-none"
      style={{ left: node.x ?? 40, top: node.y ?? 40, width: SIMDIF_NODE_W }}
    >
      <div className="flex items-center gap-1.5 cursor-move" onMouseDown={startDrag}>
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {editing ? (
          <div className="flex items-center gap-1 flex-1">
            <input value={nameVal} onChange={(e) => setNameVal(e.target.value)} autoFocus className="flex-1 px-1.5 py-0.5 rounded border border-input text-xs font-body" />
            <button onClick={saveName} className="p-0.5 rounded hover:bg-muted text-accent"><Check className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <>
            <span className="text-sm font-body font-medium truncate flex-1">{node.name}</span>
            {canManage && <button onClick={() => setEditing(true)} className="p-0.5 rounded hover:bg-muted text-muted-foreground shrink-0"><Pencil className="w-3 h-3" /></button>}
          </>
        )}
      </div>

      <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-body bg-accent/15 text-accent">{scopeLabel}</span>

      {employee ? (
        <div className="flex items-center justify-between gap-1 p-1.5 rounded-md bg-muted/60 text-xs font-body">
          <span className="truncate">{employee.name}</span>
          {canManage && <button onClick={onUnassign} title={t("cancel")} className="p-0.5 rounded hover:bg-muted text-muted-foreground shrink-0"><X className="w-3 h-3" /></button>}
        </div>
      ) : canManage ? (
        <button onClick={() => setAssigning(true)} className="flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-border text-[11px] font-body text-muted-foreground hover:bg-muted w-full justify-center">
          <UserPlus className="w-3 h-3" /> {t("assignEmployee")}
        </button>
      ) : (
        <p className="text-[11px] text-muted-foreground font-body italic">{t("noManagerAssigned")}</p>
      )}

      {canManage && (
        <div className="flex items-center gap-1">
          <select value={node.parentId || ""} onChange={(e) => onSetParent(e.target.value || null)} className="flex-1 px-1.5 py-1 rounded-md border border-input text-[10px] font-body bg-card">
            <option value="">{t("noParentOption")}</option>
            {parentOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ConfirmDeleteDialog onConfirm={onRemove} trigger={<button className="p-1 rounded hover:bg-muted text-destructive shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>} />
        </div>
      )}

      {assigning && (
        <HRAssignModal
          title={`${t("assignEmployee")} — ${node.name}`}
          defaultPosition={node.name}
          eligibleEmployees={eligible}
          onAssignExisting={(empId) => onAssignExisting(empId)}
          onHireNew={({ name, email }) => onHireNew({ name, email })}
          onClose={() => setAssigning(false)}
        />
      )}
    </div>
  );
}