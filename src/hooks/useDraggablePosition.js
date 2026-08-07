import { useRef, useState } from "react";

const STORAGE_KEY = "powercare_music_button_position";

export default function useDraggablePosition() {
  const [position, setPosition] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
  });
  const drag = useRef(null);
  const lastPosition = useRef(position);

  const onPointerDown = (event) => {
    const rect = event.currentTarget.parentElement?.getBoundingClientRect() || event.currentTarget.getBoundingClientRect();
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true;
    const next = {
      x: Math.max(8, Math.min(window.innerWidth - drag.current.width - 8, drag.current.left + dx)),
      y: Math.max(8, Math.min(window.innerHeight - drag.current.height - 8, drag.current.top + dy)),
    };
    lastPosition.current = next;
    setPosition(next);
  };
  const onPointerUp = (event) => {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    if (drag.current.moved) localStorage.setItem(STORAGE_KEY, JSON.stringify(lastPosition.current));
    drag.current = null;
  };

  return { position, handlers: { onPointerDown, onPointerMove, onPointerUp } };
}