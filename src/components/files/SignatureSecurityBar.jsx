import React, { useState } from "react";
import { Check, Copy, Fingerprint, LockKeyhole, ShieldCheck, Timer } from "lucide-react";

export default function SignatureSecurityBar({ signatureId, timestamp, verified, ar }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!signatureId) return;
    await navigator.clipboard.writeText(signatureId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const formatted = timestamp ? new Date(timestamp).toLocaleString(ar ? "ar-SA" : "en-GB", { dateStyle: "full", timeStyle: "medium" }) : "—";

  return (
    <section className="overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-l from-primary to-sidebar text-primary-foreground shadow-elevated">
      <div className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white ${verified ? "bg-emerald-600" : "bg-accent/80"}`}><ShieldCheck className="h-5 w-5" />{verified ? (ar ? "تم التحقق من سلامة الملف بعد التوقيع" : "File integrity verified after signing") : (ar ? "بانتظار توقيع المستند لإنشاء بصمة التحقق" : "Waiting for document signing to create its verification fingerprint")}</div>
      <div className="grid gap-px bg-primary-foreground/10 sm:grid-cols-3">
        <div className="flex items-center gap-3 bg-primary/70 p-4"><Timer className="h-5 w-5 shrink-0 text-accent" /><div><p className="text-[10px] uppercase tracking-widest text-primary-foreground/55">{ar ? "الختم الزمني" : "Timestamp"}</p><p className="mt-1 text-xs font-medium" dir="auto">{verified ? formatted : (ar ? "يُنشأ بعد التوقيع" : "Created after signing")}</p></div></div>
        <div className="flex items-center gap-3 bg-primary/70 p-4"><Fingerprint className="h-5 w-5 shrink-0 text-accent" /><div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-widest text-primary-foreground/55">{ar ? "بصمة تحقق المستند" : "Document verification fingerprint"}</p><p className="mt-1 truncate font-mono text-xs" dir={verified ? "ltr" : "auto"}>{verified ? (signatureId || "PWC-••••-••••-••••") : (ar ? "بانتظار توقيع الملف" : "Waiting for signing")}</p></div><button type="button" onClick={copy} disabled={!verified || !signatureId} className="rounded-lg border border-primary-foreground/15 p-2 hover:bg-primary-foreground/10 disabled:opacity-40" aria-label={ar ? "نسخ رمز التحقق" : "Copy verification code"}>{copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-accent" />}</button></div>
        <div className="flex items-center gap-3 bg-primary/70 p-4"><LockKeyhole className="h-5 w-5 shrink-0 text-accent" /><div><p className="text-[10px] uppercase tracking-widest text-primary-foreground/55">{ar ? "حماية المستند" : "Document protection"}</p><p className="mt-1 text-xs font-medium">{verified ? (ar ? "بصمة SHA-256 وسجل غير قابل للتعديل" : "SHA-256 fingerprint and immutable record") : (ar ? "تُفعّل بعد اكتمال التوقيع" : "Activated after signing is complete")}</p></div></div>
      </div>
    </section>
  );
}