import React, { useState } from "react";
import { PenLine, ShieldCheck } from "lucide-react";
import PublicSignDocumentPanel from "@/components/files/PublicSignDocumentPanel";
import PublicSignSignaturePanel from "@/components/files/PublicSignSignaturePanel";
import SignSpotPicker from "@/components/files/SignSpotPicker";

export default function PublicSignWorkspace({ signing }) {
  const [showSpotPicker, setShowSpotPicker] = useState(false);
  const { ar, info, chosenSpot, setChosenSpot, sigSize, setSigSize, stampPreview } = signing;
  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-accent"><PenLine className="h-5 w-5" /></span><div><p className="text-[11px] font-semibold uppercase tracking-widest text-accent">{ar ? "جاهز للتوقيع" : "Ready for signature"}</p><h2 className="mt-1 font-heading text-2xl font-semibold sm:text-3xl">{ar ? "وقّع المستند" : "Sign the document"}</h2><p className="mt-1 text-xs text-muted-foreground">{ar ? `${info.creatorName} أرسل إليك هذا المستند للتوقيع.` : `${info.creatorName} sent you this document to sign.`}</p></div></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-medium"><ShieldCheck className="h-4 w-4 text-accent" />{info.signedCount}/{info.totalCount} {ar ? "توقيعات مكتملة" : "signatures complete"}</span>
      </header>
      <div className="grid items-start gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <PublicSignDocumentPanel ar={ar} info={info} chosenSpot={chosenSpot} onChooseSpot={() => setShowSpotPicker(true)} />
        <PublicSignSignaturePanel {...signing} />
      </div>
      {showSpotPicker && <SignSpotPicker docUrl={info.docUrl} stampPreview={stampPreview} initialSpot={chosenSpot || info.signer.spot || null} initialScale={sigSize} signerName={info.signer.name} verificationId={info.verificationId} ar={ar} onConfirm={(spot, scale) => { setChosenSpot(spot); setSigSize(scale); setShowSpotPicker(false); }} onClose={() => setShowSpotPicker(false)} />}
    </section>
  );
}