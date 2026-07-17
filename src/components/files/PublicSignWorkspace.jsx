import React, { useState } from "react";
import { PenLine, ShieldCheck } from "lucide-react";
import PublicSignDocumentPanel from "@/components/files/PublicSignDocumentPanel";
import PublicSignSignaturePanel from "@/components/files/PublicSignSignaturePanel";
import SignSpotPicker from "@/components/files/SignSpotPicker";

export default function PublicSignWorkspace({ signing }) {
  const [showSpotPicker, setShowSpotPicker] = useState(false);
  const { ar, info, chosenSpot, setChosenSpot, sigSize, setSigSize } = signing;
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-sign-surface shadow-sm">
      <header className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div><h2 className="flex items-center gap-2 font-heading text-2xl font-semibold"><PenLine className="h-5 w-5 text-sign-gold" />{ar ? "توقيع المستند" : "Sign the document"}</h2><p className="mt-1 text-xs text-muted-foreground">{ar ? `${info.creatorName} أرسل إليك هذا المستند للتوقيع.` : `${info.creatorName} sent you this document to sign.`}</p></div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-sign-gold/30 bg-sign-bg px-3 py-1.5 text-xs font-medium text-sign-gold"><ShieldCheck className="h-3.5 w-3.5" />{info.signedCount}/{info.totalCount} {ar ? "توقيعات مكتملة" : "signatures complete"}</span>
      </header>
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.85fr_1.4fr]">
        <PublicSignDocumentPanel ar={ar} info={info} chosenSpot={chosenSpot} onChooseSpot={() => setShowSpotPicker(true)} />
        <PublicSignSignaturePanel {...signing} />
      </div>
      {showSpotPicker && <SignSpotPicker docUrl={info.docUrl} initialSpot={chosenSpot || info.signer.spot || null} initialScale={sigSize} signerName={info.signer.name} ar={ar} onConfirm={(spot, scale) => { setChosenSpot(spot); setSigSize(scale); setShowSpotPicker(false); }} onClose={() => setShowSpotPicker(false)} />}
    </section>
  );
}