import React from "react";
import { AlertCircle, CheckCircle2, Clock3, Download, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

export default function PublicSignStateCard({ ar, type, info, done, message, onRetry }) {
  if (type === "loading") return <div className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-sign-surface shadow-sm"><Loader2 className="h-6 w-6 animate-spin text-sign-gold" /></div>;
  const success = type === "success";
  const waiting = type === "waiting";
  const finalUrl = done?.docUrl || info?.docUrl;
  const fingerprint = done?.finalHash || info?.finalHash;
  return (
    <section className="rounded-2xl border border-border bg-sign-surface p-6 text-center shadow-sm sm:p-10">
      <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${success ? "bg-emerald-50 text-emerald-700" : waiting ? "bg-sign-bg text-sign-gold" : "bg-destructive/10 text-destructive"}`}>
        {success ? <CheckCircle2 className="h-7 w-7" /> : waiting ? <Clock3 className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
      </span>
      <h2 className="mt-4 font-heading text-2xl font-semibold">{success ? (ar ? "تم تسجيل توقيعك بنجاح" : "Your signature was recorded") : waiting ? (ar ? "بانتظار الطرف السابق" : "Waiting for the previous signer") : (ar ? "تعذّر فتح طلب التوقيع" : "The signing request couldn't be opened")}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{success ? (done?.completed || info?.status === "completed" ? (ar ? "اكتملت جميع التوقيعات وسُجّلت بصمة النسخة النهائية." : "All signatures are complete and the final fingerprint is registered.") : (ar ? "بانتظار بقية الموقّعين، وسيصل إشعار عند اكتمال الجميع." : "Waiting for the remaining signers; a notification will be sent when complete.")) : waiting ? (ar ? "يجب أن يوقّع الطرف السابق أولًا حسب ترتيب الطلب." : "The previous party must sign first according to the request order.") : message}
      </p>
      {fingerprint && <div className="mx-auto mt-5 max-w-xl rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-start"><p className="flex items-center gap-2 text-xs font-semibold text-emerald-800"><ShieldCheck className="h-4 w-4" />{ar ? "بصمة الملف النهائية" : "Final file fingerprint"}</p><p dir="ltr" className="mt-2 break-all font-mono text-[10px] text-emerald-700">{fingerprint}</p></div>}
      <div className="mt-6 flex justify-center">
        {success && (done?.completed || info?.status === "completed") ? <a href={finalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-sign-ink px-5 py-2.5 text-sm font-medium text-white"><Download className="h-4 w-4" />{ar ? "تنزيل النسخة النهائية" : "Download final copy"}</a> : !success && <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg bg-sign-ink px-5 py-2.5 text-sm font-medium text-white"><RefreshCw className="h-4 w-4" />{waiting ? (ar ? "تحديث الحالة" : "Refresh status") : (ar ? "إعادة المحاولة" : "Try again")}</button>}
      </div>
    </section>
  );
}