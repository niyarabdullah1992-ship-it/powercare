import { useRef } from "react";

export default function useOrgNodeDrag(nodeId, enabled, onStart, onEnd, onDrop) {
  const timer = useRef(null);
  const active = useRef(false);
  const blockClick = useRef(false);
  const start = useRef(null);
  const clear = () => { clearTimeout(timer.current); timer.current = null; };
  const onPointerDown = (event) => {
    if (!enabled || event.pointerType === "mouse") return;
    start.current = { x: event.clientX, y: event.clientY };
    timer.current = setTimeout(() => { active.current = true; event.currentTarget.setPointerCapture(event.pointerId); onStart(nodeId); }, 280);
    event.stopPropagation();
  };
  const onPointerMove = (event) => {
    if (!start.current) return;
    const moved = Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y);
    if (!active.current && moved > 8) clear();
    if (active.current) event.preventDefault();
  };
  const onPointerUp = (event) => {
    clear(); start.current = null;
    if (!active.current) return;
    const zone = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-org-drop]");
    if (zone) onDrop(zone.dataset.targetId, zone.dataset.dropMode);
    blockClick.current = true;
    setTimeout(() => { blockClick.current = false; }, 0);
    active.current = false; onEnd(); event.preventDefault();
  };
  const onPointerCancel = () => { clear(); start.current = null; if (active.current) onEnd(); active.current = false; };
  return { handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel }, suppressClick: () => active.current || blockClick.current };
}