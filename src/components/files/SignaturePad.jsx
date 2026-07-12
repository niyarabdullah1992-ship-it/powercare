import React, { useRef, useState } from "react";
import { Eraser, Check } from "lucide-react";

// Draw-your-signature canvas (mouse + touch). Calls onSave(dataUrl) with a PNG.
export default function SignaturePad({ ar, onSave, saving }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };
  const start = (e) => {
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  };
  const end = () => { drawing.current = false; };
  const clear = () => {
    const c = canvasRef.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={420}
        height={140}
        className="w-full max-w-[420px] h-[140px] bg-white rounded-lg border-2 border-dashed border-border cursor-crosshair touch-none"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <div className="flex items-center gap-2">
        <button type="button" onClick={clear} className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
          <Eraser className="w-3.5 h-3.5" /> {ar ? "مسح" : "Clear"}
        </button>
        <button
          type="button"
          disabled={!hasInk || saving}
          onClick={() => onSave(canvasRef.current.toDataURL("image/png"))}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-40"
        >
          <Check className="w-3.5 h-3.5" /> {saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "حفظ التوقيع" : "Save signature"}
        </button>
      </div>
    </div>
  );
}