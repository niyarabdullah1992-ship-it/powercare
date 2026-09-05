import React from "react";
import { CheckCircle2, Clock3, Circle, XCircle } from "lucide-react";

export default function SignersProgress({ signers = [], ar }) {
  const signed = signers.filter((signer) => signer.status === "signed").length;
  const activeIndex = signers.findIndex((signer) => signer.status !== "signed");
  const progress = signers.length ? (signed / signers.length) * 100 : 0;
  const rejected = signers.some((signer) => signer.status === "rejected");

  return (
    <div className="space-y-3">
      <div className="flex items-center overflow-x-auto pb-1 no-scrollbar">
        {signers.map((signer, index) => {
          const complete = signer.status === "signed";
          const rejected = signer.status === "rejected";
          const active = !complete && !rejected && index === activeIndex;
          return (
            <div key={`${signer.email}-${index}`} title={signer.name} className={`-ms-2 first:ms-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-card shadow-sm ${complete ? "border-emerald-200 bg-emerald-50 text-emerald-700" : rejected ? "border-destructive/30 bg-destructive/10 text-destructive" : active ? "border-amber-200 bg-amber-50 text-amber-700" : "border-border bg-muted text-muted-foreground"}`}>
              {complete ? <CheckCircle2 className="h-4 w-4" /> : rejected ? <XCircle className="h-4 w-4" /> : active ? <Clock3 className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />}
            </div>
          );
        })}
        <span className="ms-auto shrink-0 text-xs font-medium text-muted-foreground">{signed}/{signers.length} {ar ? "وقّعوا" : "signed"}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all duration-500 ${rejected ? "bg-destructive" : signed === signers.length && signers.length ? "bg-emerald-600" : "bg-amber-500"}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}