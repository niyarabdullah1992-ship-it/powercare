import React, { forwardRef, useMemo } from "react";
import FreeOrgNodeCard from "@/components/hr/FreeOrgNodeCard";
import useFreeOrgDrag from "@/hooks/useFreeOrgDrag";
import orgVisualLayout from "@/lib/orgVisualLayout";

const FreeOrgCanvas = forwardRef(function FreeOrgCanvas({ nodes, data, savedPositions, escalationChain, canManage, ar, zoom, onMove, onHierarchyChange, onEdit, onToggleEscalation }, ref) {
  const automatic = useMemo(() => orgVisualLayout(nodes), [nodes]);
  const drag = useFreeOrgDrag(zoom, onMove, handleHierarchyDrop);
  const positions = Object.fromEntries(nodes.map((node) => [node.id, drag.live[node.id] || savedPositions[node.id] || automatic[node.id]]));
  function handleHierarchyDrop(nodeId, targetId, mode) {
    const target = positions[targetId];
    if (!target || nodeId === targetId) return null;
    const offsets = { above: [0, -160], below: [0, 160], left: [-280, 0], right: [280, 0] };
    const [dx, dy] = offsets[mode];
    const snapped = { x: Math.max(0, target.x + dx), y: Math.max(0, target.y + dy) };
    onMove(nodeId, snapped); onHierarchyChange(nodeId, targetId, mode);
    return snapped;
  }
  const width = Math.max(900, ...Object.values(positions).map((point) => point.x + 280));
  const height = Math.max(560, ...Object.values(positions).map((point) => point.y + 140));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return <div ref={ref} className="relative origin-top-left" style={{ width, height, zoom }} dir="ltr">
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      {nodes.filter((node) => node.parentId && positions[node.parentId]).map((node) => {
        const from = positions[node.parentId]; const to = positions[node.id];
        const startX = from.x + 112; const startY = from.y + 76; const endX = to.x + 112; const endY = to.y;
        return <path key={node.id} d={`M ${startX} ${startY} C ${startX} ${(startY + endY) / 2}, ${endX} ${(startY + endY) / 2}, ${endX} ${endY}`} fill="none" stroke="hsl(var(--accent) / .55)" strokeWidth="2" />;
      })}
    </svg>
    {nodes.map((node) => {
      const point = positions[node.id]; const source = node.type === "employee" ? data.employees.find((item) => item.id === node.refId) : data.stations.find((item) => item.id === node.refId);
      return <div key={node.id} className="absolute" style={{ left: point.x, top: point.y }}><FreeOrgNodeCard node={node} label={source?.name || node.title} canManage={canManage} complaintLevel={node.type === "employee" ? escalationChain.indexOf(node.refId) + 1 : 0} ar={ar} active={drag.activeId === node.id} activeDragId={drag.activeId} dragHandlers={drag.handlersFor(node.id, point, canManage)} suppressClick={drag.suppressClick} onEdit={onEdit} onToggleEscalation={() => onToggleEscalation(node.refId)} onHierarchyDrop={handleHierarchyDrop} /></div>;
    })}
  </div>;
});
export default FreeOrgCanvas;