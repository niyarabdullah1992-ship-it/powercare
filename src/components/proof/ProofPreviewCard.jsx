import React from "react";
import { Loader2, PenLine } from "lucide-react";

// Dark document-preview card: live counts, the verification id the client
// will see, and the single sign-and-issue action.
export default function ProofPreviewCard({ taskCount, evidenceCount, proofId, canIssue, issuing, onIssue, ar }) {
  return (
    <section className="rounded-xl bg-primary p-5 text-primary-foreground shadow-elevated">
      <p className="font-mono text-[10px] uppercase tracking-widest-xl text-primary-foreground/60" dir="ltr">Document Preview</p>
      <dl className="mt-4 space-y-2.5 text-sm font-body">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-primary-foreground/70">{ar ? "المهام المُدرَجة" : "Included tasks"}</dt>
          <dd className="font-semibold">{taskCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-primary-foreground/70">{ar ? "قطع الإثبات" : "Evidence pieces"}</dt>
          <dd className="font-semibold">{evidenceCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-primary-foreground/70">{ar ? "معرّف التحقق" : "Verification ID"}</dt>
          <dd className="font-mono text-xs text-accent" dir="ltr">{proofId}</dd>
        </div>
      </dl>
      <button
        type="button"
        disabled={!canIssue}
        onClick={onIssue}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-40"
      >
        {issuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
        {ar ? "توقيع وإصدار الرابط" : "Sign & issue link"}
      </button>
      <p className="mt-3 text-center text-[11px] text-primary-foreground/60 font-body">
        {ar ? "يُوقَّع بختم شركتك وتُحسب بصمته SHA-256 ويُقيَّد في سجل التدقيق." : "Sealed with your company stamp, SHA-256 fingerprinted and recorded in the audit trail."}
      </p>
    </section>
  );
}