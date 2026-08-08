import React, { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { buildClientStamp, stampDataUrlToFile } from "@/lib/clientDigitalStamp";

// The client approves with the platform's official digital stamp — no hand drawing.
export default function ClientSignDialog({ ar, proofNumber = "", onClose, onSign }) {
  const [clientName, setClientName] = useState("");
  const [clientTitle, setClientTitle] = useState("");
  const [stamp, setStamp] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const name = clientName.trim();
    if (!name) { setStamp(null); return; }
    let active = true;
    const timer = setTimeout(async () => {
      const built = await buildClientStamp(name);
      if (active) setStamp(built);
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [clientName]);

  const submit = async () => {
    if (!stamp || saving) return;
    setSaving(true);
    try {
      const file = await stampDataUrlToFile(stamp.dataUrl);
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
        <p className="text-xs text-muted-foreground font-body">
          {ar ? `يُنشأ ختم رقمي معتمد باسم العميل مع رقم تحقق مشفّر ورمز QR للتحقق${proofNumber ? ` — ${proofNumber}` : ""}.` : "An official digital stamp is generated with an encrypted verification ID and QR code."}
        </p>
        <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-accent/40 bg-primary/95 p-3">
          {stamp ? (
            <img src={stamp.dataUrl} alt="client stamp" className="max-h-32 w-full object-contain" />
          ) : clientName.trim() ? (
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          ) : (
            <p className="text-xs text-primary-foreground/60 font-body">{ar ? "اكتب اسم العميل لإنشاء الختم" : "Enter the client name to build the stamp"}</p>
          )}
        </div>
        <button type="button" onClick={submit} disabled={!stamp || saving} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? (ar ? "جارٍ الاعتماد…" : "Sealing…") : (ar ? "اعتماد بالتوقيع الرقمي" : "Approve with digital signature")}
        </button>
      </div>
    </div>
  );
}