import React from "react";
import { AlertCircle, CheckCircle2, Clock3, Download, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

export default function PublicSignStateCard({ ar, type, info, done, message, onRetry }) {
  if (type === "loading") return <div className="flex min-h-80 items-center justify-center rounded-3xl border border-border bg-card shadow-elevated"><Loader2 className="h-7 w-7 animate-spin text-accent" /></div>;
  const success = type === "success";
  const waiting = type === "waiting";
  const finalUrl = done?.docUrl || info?.docUrl;
  const fingerprint = done?.finalHash || info?.finalHash;
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-elevated">
      <div className={`h-1.5 ${success ? "bg-emerald-600" : waiting ? "bg-accent" : "bg-destructive"}`} />
      <div className="p-7 text-center sm:p-12">
        <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${success ? "bg-emerald-50 text-emerald-700" : waiting ? "bg-secondary text-accent" : "bg-destructive/10 text-destructive"}`}>{success ? <CheckCircle2 className="h-8 w-8" /> : waiting ? <Clock3 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}</span>
        <h2 className="mt-5 font-heading text-3xl font-semibold">{success ? (ar ? "تم تسجيل توقيعك" : "Your signature was recorded") : waiting ? (ar ? "بانتظار الموقّع السابق" : "Waiting for the previous signer") : (ar ? "تعذّر فتح الطلب" : "The request couldn't be opened")}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{success ? (done?.completed || info?.status === "completed" ? (ar ? "اكتملت جميع التوقيعات وتم توثيق النسخة النهائية." : "All signatures are complete and the final copy is verified.") : (ar ? "تم حفظ توقيعك، والطلب بانتظار بقية الأطراف." : "Your signature is saved; the request is waiting for the remaining parties.")) : waiting ? (ar ? "يجب أن يوقّع الطرف السابق أولًا حسب ترتيب الطلب." : "The previous party must sign first according to the request order.") : message}</p>
        {fingerprint && <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-start"><p className="flex items-center gap-2 text-xs font-semibold text-emerald-800"><ShieldCheck className="h-4 w-4" />{ar ? "بصمة الملف النهائية" : "Final file fingerprint"}</p><p dir="ltr" className="mt-2 break-all font-mono text-[10px] text-emerald-700">{fingerprint}</p></div>}
        <div className="mt-7 flex justify-center">{success && (done?.completed || info?.status === "completed") ? <a href={finalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"><Download className="h-4 w-4" />{ar ? "تنزيل النسخة النهائية" : "Download final copy"}</a> : !success && <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"><RefreshCw className="h-4 w-4" />{waiting ? (ar ? "تحديث الحالة" : "Refresh status") : (ar ? "إعادة المحاولة" : "Try again")}</button>}</div>
      </div>
    </section>
  );
}