import React, { useRef, useState } from "react";
import { Check, Eraser, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ClientSignDialog({ ar, onClose, onSign }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const [clientName, setClientName] = useState("");
  const [clientTitle, setClientTitle] = useState("");
  const [inked, setInked] = useState(false);
  const [saving, setSaving] = useState(false);

  const point = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height) };
  };
  const start = (event) => { event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); drawing.current = true; const p = point(event); const ctx = canvasRef.current.getContext("2d"); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const move = (event) => { if (!drawing.current) return; event.preventDefault(); const p = point(event); const ctx = canvasRef.current.getContext("2d"); ctx.lineTo(p.x, p.y); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 4; ctx.strokeStyle = "#111827"; ctx.stroke(); hasInk.current = true; setInked(true); };
  const end = () => { drawing.current = false; };
  const clear = () => { const c = canvasRef.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); hasInk.current = false; setInked(false); };

  const submit = async () => {
    if (!clientName.trim() || !hasInk.current || saving) return;
    setSaving(true);
    try {
      const blob = await new Promise((resolve) => canvasRef.current.toBlob(resolve, "image/png"));
      const file = new File([blob], "client-signature.png", { type: "image/png" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await onSign({ clientName: clientName.trim(), clientTitle: clientTitle.trim(), signatureUrl: file_url });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-card p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">{ar ? "توقيع العميل" : "Client signature"}</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="close"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={ar ? "اسم العميل *" : "Client name *"} className="rounded-md border px-3 py-2 text-sm font-body" />
          <input value={clientTitle} onChange={(e) => setClientTitle(e.target.value)} placeholder={ar ? "الصفة (اختياري)" : "Title (optional)"} className="rounded-md border px-3 py-2 text-sm font-body" />
        </div>
        <p className="text-xs text-muted-foreground font-body">{ar ? "يرسم العميل توقيعه داخل الإطار لاعتماد استلام العمل." : "The client draws their signature inside the frame to confirm the work."}</p>
        <canvas
          ref={canvasRef}
          width={800}
          height={240}
          className="h-32 w-full touch-none cursor-crosshair rounded-xl border-2 border-dashed border-accent/40 bg-white shadow-inner"
          onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onPointerLeave={end}
        />
        <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
          <button type="button" onClick={clear} className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary">
            <Eraser className="h-4 w-4" />{ar ? "مسح" : "Clear"}
          </button>
          <button type="button" onClick={submit} disabled={!clientName.trim() || !inked || saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-40">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? (ar ? "جارٍ الاعتماد…" : "Sealing…") : (ar ? "اعتماد وتوقيع" : "Confirm & sign")}
          </button>
        </div>
      </div>
    </div>
  );
}