import React, { useState } from "react";
import { BadgeCheck, Clock, PenLine } from "lucide-react";
import { Image } from "@/components/ui/image";
import ClientSignDialog from "@/components/workproof/ClientSignDialog";

function PhotoRow({ label, urls }) {
  if (!urls?.length) return null;
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {urls.map((url) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            <Image src={url} alt={label} className="h-14 w-14 rounded-md border border-border" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default function WorkProofCard({ proof, stationName, ar, onSign }) {
  const [signOpen, setSignOpen] = useState(false);
  const signed = proof.status === "signed";

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] text-muted-foreground">{proof.proofNumber}</p>
          <h3 className="truncate font-heading text-base font-semibold">{proof.workTitle}</h3>
          <p className="text-xs text-muted-foreground font-body">
            {stationName} · {proof.workDate} · {proof.performedByName}
          </p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-body ${signed ? "border-green-600/30 bg-green-600/10 text-green-700" : "border-amber-600/30 bg-amber-500/10 text-amber-700"}`}>
          {signed ? <BadgeCheck className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          {signed ? (ar ? "موقّع من العميل" : "Client signed") : (ar ? "بانتظار توقيع العميل" : "Awaiting client signature")}
        </span>
      </div>
      {proof.workDescription && <p className="text-sm text-foreground/80 font-body">{proof.workDescription}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <PhotoRow label={ar ? "قبل" : "Before"} urls={proof.beforeImageUrls} />
        <PhotoRow label={ar ? "بعد" : "After"} urls={proof.afterImageUrls} />
      </div>
      {signed ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/25 bg-accent/5 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium font-body">{proof.clientName}{proof.clientTitle ? ` — ${proof.clientTitle}` : ""}</p>
            <p className="text-[10px] text-muted-foreground font-body">
              {ar ? "وقّع في" : "Signed at"} {new Date(proof.signedAt).toLocaleString(ar ? "ar" : "en")}
            </p>
          </div>
          {proof.clientSignatureUrl && (
            <Image src={proof.clientSignatureUrl} alt="signature" fittingType="fit" className="h-12 w-28 shrink-0 rounded-md border border-border bg-white" />
          )}
        </div>
      ) : (
        <button onClick={() => setSignOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
          <PenLine className="h-4 w-4" />
          {ar ? "توقيع العميل الآن" : "Client sign now"}
        </button>
      )}
      {signOpen && <ClientSignDialog ar={ar} onClose={() => setSignOpen(false)} onSign={async (payload) => { const ok = await onSign(payload); if (ok) setSignOpen(false); }} />}
    </div>
  );
}