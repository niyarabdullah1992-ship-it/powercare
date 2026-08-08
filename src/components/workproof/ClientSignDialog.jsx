import React, { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { buildClientStamp, stampDataUrlToFile } from "@/lib/clientDigitalStamp";

// The client approves with the platform's official digital stamp. The name is taken
// from the record prepared when the link was sent — the client only signs.
export default function ClientSignDialog({ ar, proofNumber = "", clientName = "", clientTitle = "", onClose, onSign }) {
  const [stamp, setStamp] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const name = clientName.trim();
    if (!name) { setStamp(null); return; }
    let active = true;
    (async () => {
      const built = await buildClientStamp(name);
      if (active) setStamp(built);
    })();
    return () => { active = false; };
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
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body">{ar ? "اسم العميل" : "Client name"}</p>
          <p className="text-sm font-medium font-body">{clientName}{clientTitle ? ` — ${clientTitle}` : ""}</p>
        </div>
        <p className="text-xs text-muted-foreground font-body">
          {ar ? `ختم رقمي معتمد باسمك مع رقم تحقق مشفّر ورمز QR${proofNumber ? ` — ${proofNumber}` : ""}.` : "An official digital stamp with an encrypted verification ID and QR code."}
        </p>
        <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-accent/40 bg-primary/95 p-3">
          {stamp ? (
            <img src={stamp.dataUrl} alt="client stamp" className="max-h-32 w-full object-contain" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
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