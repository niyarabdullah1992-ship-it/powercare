import React, { useRef, useState } from "react";
import { Check, Eraser, Minus, PenTool, Plus } from "lucide-react";
import { Image } from "@/components/ui/image";
import { makeSignatureStamp } from "@/lib/multiSignStamp";

const INKS = [
  { value: "#111827", label: "Black", className: "bg-slate-900" },
  { value: "#1d4ed8", label: "Blue", className: "bg-blue-700" },
  { value: "#b91c1c", label: "Red", className: "bg-red-700" },
];

export default function SignaturePad({ ar, signerName, verificationId, stampTheme = "heritage", onPreview, onSave, saving }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const previous = useRef(null);
  const inkRef = useRef(false);
  const [stamp, setStamp] = useState("");
  const [inkColor, setInkColor] = useState(INKS[0].value);
  const [thickness, setThickness] = useState(5);

  const point = (event) => { const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height), time: performance.now() }; };
  const start = (event) => { event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); drawing.current = true; previous.current = { ...point(event), width: thickness }; };
  const move = (event) => { if (!drawing.current || !previous.current) return; event.preventDefault(); const current = point(event); const last = previous.current; const velocity = Math.hypot(current.x - last.x, current.y - last.y) / Math.max(current.time - last.time, 1); const target = Math.max(1.5, Math.min(11, thickness + 2.2 - velocity * 2.4)); const width = last.width * .65 + target * .35; const ctx = canvasRef.current.getContext("2d"); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.quadraticCurveTo(last.x, last.y, (last.x + current.x) / 2, (last.y + current.y) / 2); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = width; ctx.strokeStyle = inkColor; ctx.stroke(); previous.current = { ...current, width }; inkRef.current = true; };
  const end = async () => { drawing.current = false; previous.current = null; if (!inkRef.current) return; const composed = await makeSignatureStamp(canvasRef.current.toDataURL("image/png"), signerName, verificationId, "drawn", stampTheme); setStamp(composed); onPreview?.(composed); };
  const clear = () => { const canvas = canvasRef.current; canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); inkRef.current = false; setStamp(""); onPreview?.(""); };

  return <div className="space-y-2.5">
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 p-2"><div className="flex items-center gap-2"><span className="text-xs font-medium text-muted-foreground">{ar ? "لون الخط" : "Ink"}</span>{INKS.map((ink) => <button key={ink.value} type="button" onClick={() => setInkColor(ink.value)} aria-label={ink.label} className={`h-7 w-7 rounded-full border-2 border-card shadow-sm ring-offset-2 ${ink.className} ${inkColor === ink.value ? "ring-2 ring-accent" : ""}`} />)}</div><div className="flex items-center gap-2"><span className="text-xs font-medium text-muted-foreground">{ar ? "السُمك" : "Width"}</span><button type="button" onClick={() => setThickness((value) => Math.max(2, value - 1))} className="rounded-md border border-border bg-card p-1.5"><Minus className="h-3.5 w-3.5" /></button><span className="w-5 text-center text-xs font-mono">{thickness}</span><button type="button" onClick={() => setThickness((value) => Math.min(10, value + 1))} className="rounded-md border border-border bg-card p-1.5"><Plus className="h-3.5 w-3.5" /></button></div></div>
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><PenTool className="h-3.5 w-3.5 text-accent" />{ar ? "ارسم توقيعك بإصبعك داخل الإطار" : "Draw your signature inside the frame"}</p>
    <canvas ref={canvasRef} width={900} height={260} className="h-28 w-full touch-none cursor-crosshair rounded-xl border-2 border-dashed border-accent/35 bg-card shadow-inner" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onPointerLeave={end} />
    {stamp && <Image src={stamp} alt={ar ? "معاينة التوقيع" : "Signature preview"} fittingType="fit" className="mx-auto h-16 w-full max-w-sm" />}
    <div className="sticky bottom-0 z-10 grid gap-2 bg-card pt-1 sm:grid-cols-[auto_1fr]"><button type="button" onClick={clear} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"><Eraser className="h-4 w-4" />{ar ? "مسح" : "Clear"}</button><button type="button" disabled={!stamp || saving} onClick={() => onSave(canvasRef.current.toDataURL("image/png"), signerName, "drawn", stampTheme)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-40"><Check className="h-4 w-4" />{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "اعتماد التوقيع" : "Approve signature")}</button></div>
  </div>;
}