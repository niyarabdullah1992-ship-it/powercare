import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, RotateCcw } from "lucide-react";

export default function FlowSwipeAction({ label, onAction, onUndo, sensitive = false, confirmLabel = "Confirm", cancelLabel = "Cancel", undoLabel = "Undo", className = "" }) {
  const trackRef = useRef(null);
  const startX = useRef(null);
  const [offset, setOffset] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(false), 5000);
    return () => clearTimeout(timer);
  }, [done]);

  const run = async () => {
    setConfirming(false); setBusy(true);
    await onAction();
    setBusy(false); setDone(!!onUndo); setOffset(0);
  };
  const finish = () => {
    const width = trackRef.current?.offsetWidth || 1;
    if (Math.abs(offset) > width * 0.45) sensitive ? setConfirming(true) : run();
    setOffset(0); startX.current = null;
  };

  if (done) return <button type="button" onClick={() => { onUndo(); setDone(false); }} className={`flex w-full items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent ${className}`}><RotateCcw className="h-4 w-4" />{undoLabel}</button>;
  if (confirming) return <div className={`flex gap-2 ${className}`}><button type="button" onClick={run} className="flex-1 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background">{confirmLabel}</button><button type="button" onClick={() => setConfirming(false)} className="rounded-lg border border-border px-3 py-2 text-xs">{cancelLabel}</button></div>;

  return <div ref={trackRef} className={`relative h-10 overflow-hidden rounded-lg border border-accent/30 bg-accent/10 touch-none ${className}`}>
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-12 text-center text-xs font-semibold text-accent">{busy ? "…" : label}</div>
    <button type="button" disabled={busy} aria-label={label} onPointerDown={(e) => { startX.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={(e) => { if (startX.current !== null) setOffset(e.clientX - startX.current); }} onPointerUp={finish} onPointerCancel={finish} style={{ transform: `translateX(${offset}px)` }} className="absolute inset-y-1 start-1 flex w-8 items-center justify-center rounded-md bg-accent text-accent-foreground shadow-sm transition-transform disabled:opacity-50"><ArrowRight className="h-4 w-4 rtl:rotate-180" /></button>
    <Check className="pointer-events-none absolute end-3 top-3 h-4 w-4 text-accent/60" />
  </div>;
}