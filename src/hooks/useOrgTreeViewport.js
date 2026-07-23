import { useRef } from "react";

const clamp = (value) => Math.max(0.1, Math.min(1.5, value));
const distance = (points) => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);

export default function useOrgTreeViewport(viewportRef, zoom, setZoom) {
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const begin = () => {
    const points = [...pointers.current.values()];
    if (points.length === 1) gesture.current = { type: "pan", ...points[0], left: viewportRef.current.scrollLeft, top: viewportRef.current.scrollTop };
    if (points.length === 2) gesture.current = { type: "pinch", distance: distance(points), zoom };
  };
  const onPointerDown = (event) => {
    if (event.target.closest("button, input, textarea, select")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    begin();
  };
  const onPointerMove = (event) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    if (points.length === 2 && gesture.current?.type === "pinch") setZoom(clamp(gesture.current.zoom * distance(points) / gesture.current.distance));
    if (points.length === 1 && gesture.current?.type === "pan") {
      viewportRef.current.scrollLeft = gesture.current.left - (points[0].x - gesture.current.x);
      viewportRef.current.scrollTop = gesture.current.top - (points[0].y - gesture.current.y);
    }
  };
  const onPointerEnd = (event) => { pointers.current.delete(event.pointerId); begin(); };
  const onWheel = (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    setZoom(clamp(zoom - event.deltaY * 0.002));
  };
  return { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onWheel };
}