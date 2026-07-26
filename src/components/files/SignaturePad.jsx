import React, { useRef, useState } from "react";
import { makeSignatureStamp } from "@/lib/multiSignStamp";

export default function SignaturePad({ ar, signerName, verificationId, onPreview, onSave, saving }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const previous = useRef(null);
  const inkRef = useRef(false);
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
    ctx.strokeStyle = "#b07d3f";
    ctx.stroke();
    previous.current = { ...current, width };
    inkRef.current = true;
  };

  const end = async () => {
    drawing.current = false;
    previous.current = null;
    if (!inkRef.current) return;
    const composed = await makeSignatureStamp(canvasRef.current.toDataURL("image/png"), signerName, verificationId);
    setStamp(composed);
    onPreview?.(composed);
  };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    inkRef.current = false;
    setStamp("");
    onPreview?.("");
  };

  return (
    <div className="space-y-2.5">
      <p className="text-center text-[11px] text-signature-ink">{ar ? "ارسم توقيعك بإصبعك داخل الإطار" : "Draw your signature inside the frame"}</p>
      <canvas ref={canvasRef} width={900} height={260} className="h-32 w-full touch-none cursor-crosshair rounded-3xl border-2 border-dashed border-signature-ink/35 bg-signature-organic shadow-inner" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onPointerLeave={end} />
      <div className="grid grid-cols-2 gap-2"><button type="button" onClick={clear} className="inline-flex h-11 items-center justify-center !rounded-full border border-signature-ink/50 px-4 text-xs font-bold text-signature-ink">{ar ? "مسح" : "Clear"}</button><button type="button" disabled={!stamp || saving} onClick={() => onSave(stamp, true)} className="inline-flex h-11 items-center justify-center !rounded-full border-2 border-signature-ink px-4 text-xs font-bold text-signature-ink disabled:opacity-40">{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "اعتماد التوقيع" : "Approve signature"}</button></div>
    </div>
  );
}