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

  if (!verified) return (
    <section className="rounded-2xl border border-accent/30 bg-card px-5 py-4 shadow-soft">
      <p className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />{ar ? "بعد توقيع المستند، إذا أردت التأكد من موثوقية الملف فاستخدم قسم التحقق وارفع الملف الموقّع." : "After signing, use the verification section and upload the signed file if you want to confirm its authenticity."}</p>
    </section>
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-l from-primary to-sidebar text-primary-foreground shadow-elevated">
      <div className="flex items-center justify-center gap-2 bg-emerald-600 px-4 py-3 text-sm font-bold text-white"><ShieldCheck className="h-5 w-5" />{ar ? "تم تسجيل بصمة المستند الموقّع" : "Signed document fingerprint registered"}</div>
      <div className="grid gap-px bg-primary-foreground/10 sm:grid-cols-3">
        <div className="flex items-center gap-3 bg-primary/70 p-4"><Timer className="h-5 w-5 shrink-0 text-accent" /><div><p className="text-[10px] uppercase tracking-widest text-primary-foreground/55">{ar ? "الختم الزمني" : "Timestamp"}</p><p className="mt-1 text-xs font-medium" dir="auto">{verified ? formatted : (ar ? "يُنشأ بعد التوقيع" : "Created after signing")}</p></div></div>
        <div className="flex items-center gap-3 bg-primary/70 p-4"><Fingerprint className="h-5 w-5 shrink-0 text-accent" /><div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-widest text-primary-foreground/55">{ar ? "بصمة تحقق المستند" : "Document verification fingerprint"}</p><p className="mt-1 truncate font-mono text-xs" dir={verified ? "ltr" : "auto"}>{verified ? (signatureId || "PWC-••••-••••-••••") : (ar ? "بانتظار توقيع الملف" : "Waiting for signing")}</p></div><button type="button" onClick={copy} disabled={!verified || !signatureId} className="rounded-lg border border-primary-foreground/15 p-2 hover:bg-primary-foreground/10 disabled:opacity-40" aria-label={ar ? "نسخ رمز التحقق" : "Copy verification code"}>{copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-accent" />}</button></div>
        <div className="flex items-center gap-3 bg-primary/70 p-4"><LockKeyhole className="h-5 w-5 shrink-0 text-accent" /><div><p className="text-[10px] uppercase tracking-widest text-primary-foreground/55">{ar ? "حماية المستند" : "Document protection"}</p><p className="mt-1 text-xs font-medium">{verified ? (ar ? "بصمة SHA-256 وسجل غير قابل للتعديل" : "SHA-256 fingerprint and immutable record") : (ar ? "تُفعّل بعد اكتمال التوقيع" : "Activated after signing is complete")}</p></div></div>
      </div>
      <p className="flex items-start gap-2 border-t border-primary-foreground/10 bg-primary/80 px-4 py-3 text-xs leading-5 text-primary-foreground/75"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{ar ? "إذا أردت التأكد من موثوقية الملف، استخدم قسم التحقق وارفع النسخة الموقّعة." : "To confirm the file's authenticity, use the verification section and upload the signed copy."}</p>
    </section>
  );
}