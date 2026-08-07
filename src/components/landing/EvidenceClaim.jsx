import React from "react";
import { ShieldCheck } from "lucide-react";

// Replaces the old unsourced achievement numbers with a claim the visitor can
// verify on the product itself — "evidence before judgement" applies to the site too.
export default function EvidenceClaim({ lang }) {
  const ar = lang === "ar";
  return (
    <div className="mx-auto mb-7 max-w-[1380px]">
      <div className="rounded-xl border border-landing-gold/25 bg-primary p-7 text-primary-foreground shadow-soft sm:p-9">
        <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-landing-gold/15 text-landing-gold-light">
          <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
        </span>
        <p className="max-w-3xl font-heading text-2xl font-semibold leading-snug tracking-[-0.02em] sm:text-3xl">
          {ar
            ? "من لا دليل له لا درجة له، ومن له دليل لا يُظلم."
            : "No score without evidence. No one with evidence is wronged."}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-primary-foreground/75">
          {ar
            ? "كل درجة في NiroVera لها سجل قيود قابل للتدقيق. اضغط أي رقم لترى مصدره: المهمة، ووزنها، ومن اعتمدها، ومتى، ودليلها."
            : "Every score in NiroVera has an auditable ledger. Click any number to see its source: the task, its weight, who approved it, when, and the evidence behind it."}
        </p>
      </div>
    </div>
  );
}