import React from "react";
import { ExternalLink, FileText, MousePointerClick, ShieldCheck } from "lucide-react";

export default function PublicSignDocumentPanel({ ar, info, chosenSpot, onChooseSpot }) {
  const spot = chosenSpot || info.signer.spot;
  return (
    <aside className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <div className="border-b border-border p-5"><p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{ar ? "المستند المطلوب" : "Requested document"}</p><a href={info.docUrl} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-3 rounded-2xl bg-secondary p-4 transition hover:ring-2 hover:ring-ring/30"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm"><FileText className="h-5 w-5 text-accent" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{info.fileName}</span><span className="mt-1 block text-[10px] text-muted-foreground">PDF · {ar ? "فتح المعاينة" : "Open preview"}</span></span><ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" /></a></div>
      <div className="space-y-5 p-5">
        <div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-accent"><MousePointerClick className="h-4 w-4" /></span><p className="mt-3 text-sm font-semibold">{ar ? "موضع التوقيع" : "Signature placement"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{spot ? (ar ? `سيظهر توقيعك في الصفحة ${spot.page}.` : `Your signature will appear on page ${spot.page}.`) : (ar ? "اختر موضع توقيعك داخل المستند." : "Choose where your signature appears in the document.")}</p><button onClick={onChooseSpot} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary">{spot ? (ar ? "تعديل الموضع" : "Edit placement") : (ar ? "اختيار الموضع" : "Choose placement")}</button></div>
        {info.verificationId && <div className="border-t border-border pt-5"><p className="flex items-center gap-2 text-xs font-semibold"><ShieldCheck className="h-4 w-4 text-accent" />{ar ? "معرّف التحقق المشفّر" : "Encrypted verification ID"}</p><p dir="ltr" className="mt-2 break-all rounded-xl bg-secondary px-3 py-2 font-mono text-[10px] text-muted-foreground">{info.verificationId}</p></div>}
      </div>
    </aside>
  );
}