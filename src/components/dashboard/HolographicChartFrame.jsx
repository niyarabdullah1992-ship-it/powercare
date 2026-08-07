import React, { useRef } from "react";

export default function HolographicChartFrame({ children, className = "" }) {
  const frameRef = useRef(null);
  const move = (event) => {
    const frame = frameRef.current;
    const bounds = frame.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    frame.style.setProperty("--holo-x", `${x * 100}%`);
    frame.style.setProperty("--holo-y", `${y * 100}%`);
    frame.style.setProperty("--holo-ry", `${(x - 0.5) * 7}deg`);
    frame.style.setProperty("--holo-rx", `${(0.5 - y) * 7}deg`);
  };
  const reset = () => {
    const frame = frameRef.current;
    frame.style.setProperty("--holo-ry", "0deg");
    frame.style.setProperty("--holo-rx", "0deg");
  };
  return (
    <div ref={frameRef} onMouseMove={move} onMouseLeave={reset} className={`holographic-chart-frame ${className}`}>
      <div className="holographic-chart-float">{children}</div>
    </div>
  );
}