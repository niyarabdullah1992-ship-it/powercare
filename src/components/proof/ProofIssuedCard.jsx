import React, { useState } from "react";
import { Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { proofPublicUrl, proofQrUrl } from "@/lib/clientProof";

// The shareable result: public link, QR code and the SHA-256 fingerprint.
export default function ProofIssuedCard({ proofId, contentHash, ar }) {
  const [copied, setCopied] = useState(false);
  const url = proofPublicUrl(proofId);
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <section className="rounded-xl border-2 border-accent/50 bg-card p-5">
      <p className="flex items-center gap-2 font-heading text-lg font-semibold">
        <ShieldCheck className="h-5 w-5 text-accent" />
        {ar ? "تم إصدار إثبات العمل" : "Work proof issued"}
      </p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <img src={proofQrUrl(proofId)} alt="QR" className="h-32 w-32 shrink-0 rounded-lg border border-border bg-white p-1.5" />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{ar ? "رقم الإثبات" : "Proof reference"}</p>
            <p className="font-mono text-lg font-semibold text-primary" dir="ltr">{proofId}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">SHA-256</p>
            <p className="break-all font-mono text-[11px] text-muted-foreground" dir="ltr">{contentHash}</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-body hover:bg-muted">
              <Copy className="h-3.5 w-3.5" /> {copied ? (ar ? "تم النسخ" : "Copied") : (ar ? "نسخ رابط العميل" : "Copy client link")}
            </button>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-body text-primary-foreground">
              <ExternalLink className="h-3.5 w-3.5" /> {ar ? "فتح صفحة التحقق" : "Open verification page"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}