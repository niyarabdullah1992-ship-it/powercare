import React, { useEffect, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { drawClientStamp, stampBlob } from "@/lib/clientDigitalStamp";

// The client approves with an auto-generated digital signature stamp — no hand drawing.
export default function ClientSignDialog({ ar, proofNumber = "", onClose, onSign }) {
  const canvasRef = useRef(null);
  const [clientName, setClientName] = useState("");
  const [clientTitle, setClientTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      drawClientStamp(canvasRef.current, { name: clientName.trim() || (ar ? "اسم العميل" : "Client name"), title: clientTitle.trim(), proofNumber, ar });
    }
  }, [clientName, clientTitle, proofNumber, ar]);

  const submit = async () => {
    if (!clientName.trim() || saving) return;
    setSaving(true);
    try {
      const blob = await stampBlob(canvasRef.current);
      const file = new File([blob], "client-digital-stamp.png", { type: "image/png" });
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
          <h3 className="font-heading text-lg font-semibold">{ar ? "التوقيع الرقمي للعميل" : "Client digital signature"}</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="close"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={ar ? "اسم العميل *" : "Client name *"} className="rounded-md border px-3 py-2 text-sm font-body" />
          <input value={clientTitle} onChange={(e) => setClientTitle(e.target.value)} placeholder={ar ? "الصفة (اختياري)" : "Title (optional)"} className="rounded-md border px-3 py-2 text-sm font-body" />
        </div>
        <p className="text-xs text-muted-foreground font-body">{ar ? "يُنشأ ختم توقيع رقمي معتمد باسم العميل وتاريخ الاعتماد تلقائياً." : "A verified digital stamp is generated automatically with the client's name and approval time."}</p>
        <canvas ref={canvasRef} className="w-full rounded-xl border border-accent/40" />
        <button type="button" onClick={submit} disabled={!clientName.trim() || saving} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? (ar ? "جارٍ الاعتماد…" : "Sealing…") : (ar ? "اعتماد بالتوقيع الرقمي" : "Approve with digital signature")}
        </button>
      </div>
    </div>
  );
}