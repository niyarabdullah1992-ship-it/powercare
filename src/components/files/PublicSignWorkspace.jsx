import React, { useRef } from "react";
import { PenLine, ShieldCheck } from "lucide-react";
import PublicSignDocumentPanel from "@/components/files/PublicSignDocumentPanel";
import PublicSignSignaturePanel from "@/components/files/PublicSignSignaturePanel";
import PublicSignRequestSummary from "@/components/files/PublicSignRequestSummary";

export default function PublicSignWorkspace({ signing, reviewed, onContinue }) {
  const signatureRef = useRef(null);
  const { ar, info, textValues, setTextValue } = signing;
  return <section className="space-y-5">
    <header className="flex flex-col gap-4 rounded-3xl border border-accent/20 bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-7"><div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-accent"><PenLine className="h-5 w-5" /></span><div><p className="text-[11px] font-semibold uppercase tracking-widest text-accent">{reviewed ? (ar ? "مرحلة التوقيع" : "Signature stage") : (ar ? "مرحلة المراجعة" : "Review stage")}</p><h2 className="mt-1 font-heading text-2xl font-semibold sm:text-3xl">{reviewed ? (ar ? "املأ الحقول ووقّع" : "Complete fields and sign") : (ar ? "راجع المستند والطلب" : "Review document and request")}</h2><p className="mt-1 text-xs text-muted-foreground">{ar ? `${info.creatorName} أرسل إليك هذا المستند.` : `${info.creatorName} sent you this document.`}</p></div></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-medium"><ShieldCheck className="h-4 w-4 text-accent" />{info.signedCount}/{info.totalCount} {ar ? "مكتمل" : "complete"}</span></header>
    {!reviewed ? <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_0.8fr]"><PublicSignDocumentPanel ar={ar} info={info} textValues={textValues} onTextChange={setTextValue} interactive={false} /><PublicSignRequestSummary ar={ar} info={info} onContinue={onContinue} /></div> : <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]"><PublicSignDocumentPanel ar={ar} info={info} textValues={textValues} onTextChange={setTextValue} onSignatureClick={() => signatureRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })} /><div ref={signatureRef}><PublicSignSignaturePanel {...signing} /></div></div>}
  </section>;
}