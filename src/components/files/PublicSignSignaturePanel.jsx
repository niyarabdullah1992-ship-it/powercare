import React from "react";
import { Keyboard, Loader2, PenLine } from "lucide-react";
import SignaturePad from "@/components/files/SignaturePad";
import TypedSignature from "@/components/files/TypedSignature";

export default function PublicSignSignaturePanel({ ar, info, mode, setMode, sigSize, setSigSize, sign, signing, stage, error }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-elevated sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{ar ? "الموقّع" : "Signer"}</p><h3 className="mt-1 font-heading text-2xl font-semibold">{info.signer.name}</h3></div><span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-heading text-lg text-primary-foreground">{info.signer.name?.charAt(0)}</span></div>
      <div className="mb-6 grid grid-cols-2 rounded-2xl bg-secondary p-1.5">
        <button onClick={() => setMode("type")} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${mode === "type" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}><Keyboard className="h-4 w-4" />{ar ? "كتابة الاسم" : "Type name"}</button>
        <button onClick={() => setMode("draw")} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${mode === "draw" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}><PenLine className="h-4 w-4" />{ar ? "رسم التوقيع" : "Draw"}</button>
      </div>
      <div className="mb-6 rounded-2xl border border-border p-4"><div className="flex items-center justify-between text-xs"><span className="font-medium">{ar ? "حجم التوقيع" : "Signature size"}</span><span dir="ltr" className="rounded-full bg-secondary px-2 py-1 font-mono text-[10px]">{sigSize}%</span></div><input type="range" min={50} max={200} step={10} value={sigSize} onChange={(event) => setSigSize(Number(event.target.value))} className="mt-3 w-full accent-current text-accent" /></div>
      {mode === "type" ? <TypedSignature ar={ar} defaultName={info.signer.name || ""} onSave={sign} saving={signing} /> : <SignaturePad ar={ar} onSave={sign} saving={signing} />}
      {signing && <p className="mt-4 flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-accent" />{stage}</p>}
      {error && <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-xs text-destructive">{error}</p>}
    </div>
  );
}