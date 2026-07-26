import React, { useEffect, useRef, useState } from "react";

const clamp = (value) => Math.min(1.7, Math.max(0.65, value));
const touchDistance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

export default function PagePinchZoom({ children }) {
  const rootRef = useRef(null);
  const gestureRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const start = (event) => {
      if (event.touches.length !== 2) return;
      gestureRef.current = { distance: touchDistance(event.touches), scale };
    };
    const move = (event) => {
      if (event.touches.length !== 2 || !gestureRef.current) return;
      event.preventDefault();
      setScale(clamp(gestureRef.current.scale * touchDistance(event.touches) / gestureRef.current.distance));
    };
    const end = () => { gestureRef.current = null; };
    root.addEventListener("touchstart", start, { passive: true });
    root.addEventListener("touchmove", move, { passive: false });
    root.addEventListener("touchend", end, { passive: true });
    root.addEventListener("touchcancel", end, { passive: true });
    return () => {
      root.removeEventListener("touchstart", start);
      root.removeEventListener("touchmove", move);
      root.removeEventListener("touchend", end);
      root.removeEventListener("touchcancel", end);
    };
  }, [scale]);

  return <div ref={rootRef} className="w-full min-w-0" style={{ touchAction: "pan-x pan-y" }}>
    <div className="origin-top" style={{ zoom: scale, width: `${100 / scale}%` }}>{children}</div>
  </div>;
}