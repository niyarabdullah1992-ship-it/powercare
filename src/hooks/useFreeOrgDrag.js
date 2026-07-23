import { useRef, useState } from "react";

export default function useFreeOrgDrag(zoom, onMove) {
  const drag = useRef(null);
  const blockClick = useRef(false);
  const [live, setLive] = useState({});
  const [activeId, setActiveId] = useState(null);
  const handlersFor = (nodeId, position, enabled) => ({
    onPointerDown: (event) => {
      if (!enabled || event.button > 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { nodeId, x: position.x, y: position.y, startX: event.clientX, startY: event.clientY, moved: false };
      setActiveId(nodeId);
    },
    onPointerMove: (event) => {
      if (drag.current?.nodeId !== nodeId) return;
      const dx = (event.clientX - drag.current.startX) / zoom;
      const dy = (event.clientY - drag.current.startY) / zoom;
      if (Math.hypot(dx, dy) > 3) drag.current.moved = true;
      if (!drag.current.moved) return;
      const nextPosition = { x: Math.max(0, drag.current.x + dx), y: Math.max(0, drag.current.y + dy) };
      drag.current.position = nextPosition;
      setLive((current) => ({ ...current, [nodeId]: nextPosition }));
      event.preventDefault();
    },
    onPointerUp: () => {
      if (drag.current?.nodeId !== nodeId) return;
      if (drag.current.moved) { onMove(nodeId, drag.current.position); blockClick.current = true; setTimeout(() => { blockClick.current = false; }, 0); }
      drag.current = null; setActiveId(null);
    },
    onPointerCancel: () => { drag.current = null; setActiveId(null); },
  });
  return { live, activeId, handlersFor, suppressClick: () => blockClick.current };
}