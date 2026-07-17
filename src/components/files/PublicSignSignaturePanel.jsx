import React from "react";
import { Keyboard, Loader2, PenLine } from "lucide-react";
import SignaturePad from "@/components/files/SignaturePad";
import TypedSignature from "@/components/files/TypedSignature";

export default function PublicSignSignaturePanel({ ar, info, mode, setMode, sigSize, setSigSize, sign, signing, stage, error }) {
  return (
    <div className="rounded-xl border border-border p-4 sm:p-5">
      <div className="mb-5"><p className="text-xs text-muted-foreground">{ar ? "الموقّع" : "Signer"}</p><h3 className="mt-1 font-heading text-xl font-semibold">{info.signer.name}</h3></div>
      <div className="mb-5 inline-flex rounded-xl border border-border bg-sign-bg p-1">
        <button onClick={() => setMode("type")} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition ${mode === "type" ? "bg-sign-ink text-white shadow-sm" : "text-muted-foreground"}`}><Keyboard className="h-4 w-4" />{ar ? "كتابة الاسم" : "Type name"}</button>
        <button onClick={() => setMode("draw")} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition ${mode === "draw" ? "bg-sign-ink text-white shadow-sm" : "text-muted-foreground"}`}><PenLine className="h-4 w-4" />{ar ? "رسم التوقيع" : "Draw"}</button>
      </div>
      <div className="mb-5 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{ar ? "حجم التوقيع على المستند" : "Signature size on document"}</span><span dir="ltr">{sigSize}%</span></div>
        <input type="range" min={50} max={200} step={10} value={sigSize} onChange={(event) => setSigSize(Number(event.target.value))} className="w-full accent-current text-sign-gold" />
      </div>
      {mode === "type" ? <TypedSignature ar={ar} defaultName={info.signer.name || ""} onSave={sign} saving={signing} /> : <SignaturePad ar={ar} onSave={sign} saving={signing} />}
      {signing && <p className="mt-4 flex items-center gap-2 rounded-lg bg-sign-bg px-3 py-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-sign-gold" />{stage}</p>}
      {error && <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}