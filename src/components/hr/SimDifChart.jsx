import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { addHRNode, moveHRNode, setHRNodeParent, renameHRNode, removeHRNode, assignEmployeeToHRNode, unassignHRNode, hireIntoHRNode } from "@/lib/store";
import { Plus } from "lucide-react";
import SimDifNodeCard, { SIMDIF_NODE_W } from "@/components/hr/SimDifNodeCard";
import SimDifAddNodeModal from "@/components/hr/SimDifAddNodeModal";

const NODE_H = 110;

// SimDif HR Creator — an interactive, drag-and-drop visual org chart. Admins build
// custom position nodes, assign their scope, and wire up parent-child reporting
// lines by dragging nodes and choosing "Reports To".
export default function SimDifChart({ data, canManage }) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const nodes = data.hrNodes || [];

  const nodeCenter = (n) => ({ x: (n.x ?? 40) + SIMDIF_NODE_W / 2, y: (n.y ?? 40) + NODE_H / 2 });

  const lines = nodes
    .filter((n) => n.parentId)
    .map((n) => {
      const parent = nodes.find((p) => p.id === n.parentId);
      if (!parent) return null;
      const a = nodeCenter(parent);
      const b = nodeCenter(n);
      return { id: n.id, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
    })
    .filter(Boolean);

  const maxX = Math.max(600, ...nodes.map((n) => (n.x ?? 0) + SIMDIF_NODE_W + 60));
  const maxY = Math.max(420, ...nodes.map((n) => (n.y ?? 0) + NODE_H + 60));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground font-body">{t("simdifNote")}</p>
        {canManage && (
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> {t("addNode")}
          </button>
        )}
      </div>

      {nodes.length === 0 ? (
        <p className="text-xs text-muted-foreground font-body italic">{t("noPositions")}</p>
      ) : (
        <div className="relative border border-border rounded-xl bg-muted/20 overflow-auto" style={{ height: 480 }}>
          <svg className="absolute top-0 left-0 pointer-events-none" width={maxX} height={maxY}>
            {lines.map((l) => (
              <line key={l.id} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="hsl(var(--border))" strokeWidth="2" />
            ))}
          </svg>
          <div className="relative" style={{ width: maxX, height: maxY }}>
            {nodes.map((n) => (
              <SimDifNodeCard
                key={n.id}
                node={n}
                nodes={nodes}
                data={data}
                canManage={canManage}
                onDrag={(id, x, y) => moveHRNode(data.id, id, x, y)}
                onSetParent={(parentId) => setHRNodeParent(data.id, n.id, parentId)}
                onRename={(name) => renameHRNode(data.id, n.id, name)}
                onRemove={() => removeHRNode(data.id, n.id)}
                onAssignExisting={(empId) => assignEmployeeToHRNode(data.id, n.id, empId)}
                onHireNew={({ name, email }) => hireIntoHRNode(data.id, n.id, { name, email })}
                onUnassign={() => unassignHRNode(data.id, n.id)}
              />
            ))}
          </div>
        </div>
      )}

      {adding && (
        <SimDifAddNodeModal
          data={data}
          nodes={nodes}
          onClose={() => setAdding(false)}
          onCreate={({ name, scope, scopeTargetId, parentId }) => {
            addHRNode(data.id, { name, scope, scopeTargetId, parentId, x: 40 + (nodes.length % 4) * 220, y: 40 + Math.floor(nodes.length / 4) * 140 });
          }}
        />
      )}
    </div>
  );
}