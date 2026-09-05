import React, { useRef, useState } from "react";
import { Trash2 } from "lucide-react";

// Wraps a notification row with swipe-left/right-to-delete support (touch + mouse drag).
export default function SwipeToDeleteItem({ onDelete, children }) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const THRESHOLD = 80;

  const onPointerDown = (e) => {
    startX.current = e.clientX;
    setDragging(true);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    setDragX(e.clientX - startX.current);
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(dragX) > THRESHOLD) {
      onDelete();
    } else {
      setDragX(0);
    }
  };

  const opacity = Math.max(1 - Math.abs(dragX) / (THRESHOLD * 2.5), 0.3);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#FEF2F2", color: "#DC2626" }}>
        <Trash2 className="w-4 h-4" />
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        style={{
          transform: `translateX(${dragX}px)`,
          opacity,
          transition: dragging ? "none" : "transform 0.2s ease, opacity 0.2s ease",
          touchAction: "pan-y",
        }}
        className="relative bg-card cursor-grab active:cursor-grabbing"
      >
        {children}
      </div>
    </div>
  );
}