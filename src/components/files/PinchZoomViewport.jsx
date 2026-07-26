import React, { useRef, useState } from "react";

const clamp = (value) => Math.min(4, Math.max(0.65, value));
const distance = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
const midpoint = (a, b) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });

export default function PinchZoomViewport({ children, className = "", ariaLabel }) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const gesture = useRef(null);

  const onTouchStart = (event) => {
    if (event.touches.length === 2) {
      const mid = midpoint(event.touches[0], event.touches[1]);
      gesture.current = { kind: "pinch", distance: distance(event.touches[0], event.touches[1]), mid, ...view };
    } else if (event.touches.length === 1 && view.scale > 1) {
      gesture.current = { kind: "pan", clientX: event.touches[0].clientX, clientY: event.touches[0].clientY, ...view };
    }
  };

  const onTouchMove = (event) => {
    const start = gesture.current;
    if (!start) return;
    if (start.kind === "pinch" && event.touches.length === 2) {
      event.preventDefault();
      const mid = midpoint(event.touches[0], event.touches[1]);
      setView({ scale: clamp(start.scale * distance(event.touches[0], event.touches[1]) / start.distance), x: start.x + mid.x - start.mid.x, y: start.y + mid.y - start.mid.y });
    } else if (start.kind === "pan" && event.touches.length === 1) {
      event.preventDefault();
      setView({ scale: start.scale, x: start.x + event.touches[0].clientX - start.clientX, y: start.y + event.touches[0].clientY - start.clientY });
    }
  };

  const reset = () => setView({ scale: 1, x: 0, y: 0 });

  return <div className={`relative overflow-hidden ${className}`} aria-label={ariaLabel} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => { gesture.current = null; }} onDoubleClick={reset}>
    <div className="flex min-h-full w-full items-start justify-center transition-transform duration-100" style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`, transformOrigin: "center top", touchAction: view.scale > 1 ? "none" : "pan-y" }}>{children}</div>
  </div>;
}