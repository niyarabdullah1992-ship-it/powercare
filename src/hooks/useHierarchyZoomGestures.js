import { useRef } from "react";

const clamp = (value) => Math.max(0.5, Math.min(1.5, value));
const distance = (points) => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);

export default function useHierarchyZoomGestures(containerRef, zoom, setZoom) {
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const values = () => [...pointers.current.values()];
  const start = () => {
    const points = values();
    if (points.length === 1) gesture.current = { type: "pan", x: points[0].x, y: points[0].y, left: containerRef.current.scrollLeft, top: containerRef.current.scrollTop };
    if (points.length === 2) gesture.current = { type: "pinch", distance: distance(points), zoom };
  };
  const onPointerDown = (event) => {
    if (event.pointerType !== "touch") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    start();
  };
  const onPointerMove = (event) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = values();
    if (points.length === 2 && gesture.current?.type === "pinch") setZoom(clamp(gesture.current.zoom * distance(points) / gesture.current.distance));
    if (points.length === 1 && gesture.current?.type === "pan") {
      containerRef.current.scrollLeft = gesture.current.left - (points[0].x - gesture.current.x);
      containerRef.current.scrollTop = gesture.current.top - (points[0].y - gesture.current.y);
    }
  };
  const onPointerEnd = (event) => {
    pointers.current.delete(event.pointerId);
    start();
  };
  const onWheel = (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    setZoom(clamp(zoom - event.deltaY * 0.002));
  };
  return { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onWheel };
}