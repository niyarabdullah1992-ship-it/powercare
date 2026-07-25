import { useRef, useState } from "react";

const STORAGE_KEY = "powercare_music_button_position";

export default function useDraggablePosition() {
  const [position, setPosition] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
  });
  const drag = useRef(null);
  const suppressClick = useRef(false);

  const onPointerDown = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true;
    const next = {
      x: Math.max(8, Math.min(window.innerWidth - 48, drag.current.left + dx)),
      y: Math.max(8, Math.min(window.innerHeight - 48, drag.current.top + dy)),
    };
    setPosition(next);
  };
  const onPointerUp = (event) => {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    suppressClick.current = drag.current.moved;
    if (drag.current.moved) localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    drag.current = null;
  };
  const consumeDrag = () => {
    const value = suppressClick.current;
    suppressClick.current = false;
    return value;
  };

  return { position, handlers: { onPointerDown, onPointerMove, onPointerUp }, consumeDrag };
}