import React from "react";
import { ExternalLink, FileText, MousePointerClick, ShieldCheck } from "lucide-react";

export default function PublicSignDocumentPanel({ ar, info, chosenSpot, onChooseSpot }) {
  const spot = chosenSpot || info.signer.spot;
  return (
    <aside className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">{ar ? "المستند المطلوب" : "Requested document"}</p>
        <a href={info.docUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-border bg-sign-bg p-4 transition hover:border-sign-gold/50">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sign-surface"><FileText className="h-5 w-5 text-sign-gold" /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{info.fileName}</span><span className="mt-1 block text-[10px] text-muted-foreground">PDF · {ar ? "فتح ومعاينة" : "Open and preview"}</span></span>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
        </a>
      </div>
      <div className="rounded-xl border border-border bg-sign-bg p-4">
        <p className="text-xs font-semibold">{ar ? "مكان التوقيع" : "Signature placement"}</p>
        <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">{spot ? (ar ? `موضع التوقيع في الصفحة ${spot.page}.` : `Signature placement on page ${spot.page}.`) : (ar ? "اختر موضع توقيعك داخل المستند." : "Choose where your signature appears in the document.")}</p>
        <button onClick={onChooseSpot} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-sign-gold/40 bg-sign-surface px-3 py-2 text-xs font-medium text-sign-gold"><MousePointerClick className="h-4 w-4" />{spot ? (ar ? "تعديل المكان" : "Edit placement") : (ar ? "تحديد مكان التوقيع" : "Choose placement")}</button>
      </div>
      {info.verificationId && <div className="rounded-xl border border-sign-gold/30 bg-sign-bg p-4"><p className="flex items-center gap-2 text-xs font-semibold"><ShieldCheck className="h-4 w-4 text-sign-gold" />{ar ? "رقم التحقق المشفّر" : "Encrypted verification ID"}</p><p dir="ltr" className="mt-2 break-all font-mono text-[11px] text-muted-foreground">{info.verificationId}</p></div>}
    </aside>
  );
}