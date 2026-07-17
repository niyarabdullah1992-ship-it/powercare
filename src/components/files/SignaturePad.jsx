import React, { useRef, useState } from "react";
import { Eraser, Check, PenTool } from "lucide-react";
import { makeSignatureStamp } from "@/lib/multiSignStamp";

export default function SignaturePad({ ar, signerName, verificationId, onPreview, onSave, saving }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const previous = useRef(null);
  const inkRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [stamp, setStamp] = useState("");

  const point = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height), time: performance.now() };
  };

  const start = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawing.current = true;
    previous.current = { ...point(event), width: 5 };
  };

  const move = (event) => {
    if (!drawing.current || !previous.current) return;
    event.preventDefault();
    const current = point(event);
    const last = previous.current;
    const distance = Math.hypot(current.x - last.x, current.y - last.y);
    const elapsed = Math.max(current.time - last.time, 1);
    const velocity = distance / elapsed;
    const targetWidth = Math.max(2.2, Math.min(7.5, 7.2 - velocity * 2.8));
    const width = last.width * 0.65 + targetWidth * 0.35;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.quadraticCurveTo(last.x, last.y, (last.x + current.x) / 2, (last.y + current.y) / 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = width;
    ctx.strokeStyle = "#1e293b";
    ctx.stroke();
    previous.current = { ...current, width };
    inkRef.current = true;
    setHasInk(true);
  };

  const end = async () => {
    drawing.current = false;
    previous.current = null;
    if (!inkRef.current) return;
    const composed = await makeSignatureStamp(canvasRef.current.toDataURL("image/png"), signerName, verificationId);
    setStamp(composed);
    onPreview(composed);
  };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    inkRef.current = false;
    setHasInk(false);
    setStamp("");
    onPreview("");
  };

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><PenTool className="h-4 w-4 text-accent" />{ar ? "ارسم توقيعك بإصبعك داخل الإطار" : "Draw your signature inside the frame"}</p>
      <canvas ref={canvasRef} width={900} height={260} className="h-44 w-full touch-none cursor-crosshair rounded-2xl border-2 border-dashed border-border bg-secondary/40 shadow-inner sm:h-52" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onPointerLeave={end} />
      {stamp && <div><p className="mb-2 text-xs font-medium text-muted-foreground">{ar ? "المعاينة النهائية داخل الملف" : "Final in-document preview"}</p><img src={stamp} alt={ar ? "معاينة الختم" : "Stamp preview"} className="mx-auto w-full max-w-sm" /></div>}
      <div className="grid gap-2 sm:grid-cols-[auto_1fr]"><button type="button" onClick={clear} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium hover:bg-secondary"><Eraser className="h-4 w-4" />{ar ? "مسح" : "Clear"}</button><button type="button" disabled={!stamp || saving} onClick={() => onSave(stamp, true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"><Check className="h-4 w-4" />{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "اعتماد وإرسال التوقيع" : "Approve and submit signature"}</button></div>
    </div>
  );
}