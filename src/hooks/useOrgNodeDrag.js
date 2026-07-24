import { useRef } from "react";

export default function useOrgNodeDrag(nodeId, enabled, onStart, onEnd, onDrop) {
  const timer = useRef(null);
  const active = useRef(false);
  const blockClick = useRef(false);
  const start = useRef(null);
  const clear = () => { clearTimeout(timer.current); timer.current = null; };
  const activate = () => {
    if (!start.current || active.current) return;
    active.current = true;
    start.current.target.setPointerCapture(start.current.pointerId);
    onStart(nodeId);
  };
  const onPointerDown = (event) => {
    if (!enabled || event.button > 0) return;
    start.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId, pointerType: event.pointerType, target: event.currentTarget };
    if (event.pointerType !== "mouse") timer.current = setTimeout(activate, 280);
    event.stopPropagation();
  };
  const onPointerMove = (event) => {
    if (!start.current || start.current.pointerId !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y);
    if (!active.current && start.current.pointerType === "mouse" && moved > 4) activate();
    if (!active.current && start.current.pointerType !== "mouse" && moved > 8) activate();
    if (active.current) { event.preventDefault(); event.stopPropagation(); }
  };
  const finish = (event, cancelled = false) => {
    clear();
    if (active.current && !cancelled) {
      const zone = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-org-drop]");
      if (zone) {
        const rect = zone.getBoundingClientRect();
        const mode = event.clientX < rect.left + rect.width / 2 ? "visual-left" : "visual-right";
        onDrop(zone.dataset.targetId, mode);
      }
      blockClick.current = true;
      setTimeout(() => { blockClick.current = false; }, 0);
      event.preventDefault();
    }
    if (active.current) onEnd();
    active.current = false;
    start.current = null;
  };
  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event) => finish(event),
      onPointerCancel: (event) => finish(event, true),
    },
    suppressClick: () => active.current || blockClick.current,
  };
}