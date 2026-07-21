import React from "react";
import { Keyboard, Loader2, PenLine, ShieldCheck, XCircle } from "lucide-react";
import SignaturePad from "@/components/files/SignaturePad";
import TypedSignature from "@/components/files/TypedSignature";

export default function PublicSignSignaturePanel({ ar, info, mode, setMode, stampPreview, setStampPreview, sign, reject, signing, stage, error }) {
  const [showReject, setShowReject] = React.useState(false);
  const [reason, setReason] = React.useState("");
  return (
    <div className="rounded-3xl border border-accent/25 bg-card p-5 shadow-elevated sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{ar ? "الموقّع" : "Signer"}</p><h3 className="mt-1 font-heading text-2xl font-semibold">{info.signer.name}</h3></div><span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-heading text-lg text-primary-foreground">{info.signer.name?.charAt(0)}</span></div>
      <div className="mb-6 grid grid-cols-2 rounded-2xl bg-secondary p-1.5">
        <button onClick={() => { setMode("type"); setStampPreview(""); }} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${mode === "type" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}><Keyboard className="h-4 w-4" />{ar ? "كتابة الاسم" : "Type name"}</button>
        <button onClick={() => { setMode("draw"); setStampPreview(""); }} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${mode === "draw" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}><PenLine className="h-4 w-4" />{ar ? "رسم التوقيع" : "Draw"}</button>
      </div>
      <p className="mb-5 rounded-2xl border border-border bg-secondary/60 px-4 py-3 text-xs leading-5 text-muted-foreground">{ar ? "سيُثبت توقيعك داخل الحقل الذي حدده المُرسِل ولن يتجاوز حدوده." : "Your signature will be fixed inside the field assigned by the sender."}</p>
      {info.signer.signatureUrl && <button onClick={() => sign(info.signer.signatureUrl)} disabled={signing} className="mb-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-md"><ShieldCheck className="h-4 w-4" />{ar ? "استخدام توقيعي المعتمد من ملف HR" : "Use my HR-approved signature"}</button>}
      {mode === "type" ? <TypedSignature ar={ar} defaultName={info.signer.name || ""} verificationId={info.verificationId} onPreview={setStampPreview} onSave={sign} saving={signing} /> : <SignaturePad ar={ar} signerName={info.signer.name || ""} verificationId={info.verificationId} onPreview={setStampPreview} onSave={sign} saving={signing} />}
      <button onClick={() => setShowReject((value) => !value)} className="mt-4 flex items-center gap-2 text-xs text-destructive"><XCircle className="h-4 w-4" />{ar ? "رفض المستند" : "Reject document"}</button>
      {showReject && <div className="mt-3 space-y-2 rounded-xl border border-destructive/30 p-3"><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={ar ? "سبب الرفض" : "Reason for rejection"} className="min-h-20 w-full rounded-lg border border-input p-2 text-sm" /><button onClick={() => reject(reason)} disabled={!reason.trim() || signing} className="rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-40">{ar ? "تأكيد الرفض" : "Confirm rejection"}</button></div>}
      {signing && <p className="mt-4 flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-accent" />{stage}</p>}
      {error && <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-xs text-destructive">{error}</p>}
    </div>
  );
}