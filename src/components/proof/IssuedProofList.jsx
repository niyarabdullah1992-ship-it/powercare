import React from "react";
import { Link2, Ban } from "lucide-react";
import { proofPublicUrl } from "@/lib/clientProof";

// Previously issued proofs for this company.
export default function IssuedProofList({ proofs, onRevoke, ar }) {
  if (!proofs.length) return null;
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">{ar ? "الإثباتات الصادرة" : "Issued proofs"}</p>
      <div className="space-y-2">
        {proofs.map((proof) => (
          <div key={proof.proofId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="min-w-0">
              <p className="font-mono text-sm font-semibold text-primary" dir="ltr">{proof.proofId}</p>
              <p className="truncate text-xs text-muted-foreground font-body">
                {proof.clientName || "—"} · {proof.itemCount} {ar ? "بند" : "items"} · {proof.issuedAt ? new Date(proof.issuedAt).toLocaleDateString(ar ? "ar-SA" : "en-GB") : ""}
                {proof.revoked ? ` · ${ar ? "ملغى" : "revoked"}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a href={proofPublicUrl(proof.proofId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-body hover:bg-muted">
                <Link2 className="h-3.5 w-3.5" /> {ar ? "الرابط" : "Link"}
              </a>
              {!proof.revoked && (
                <button type="button" onClick={() => onRevoke(proof.proofId)} className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-2 text-xs font-body text-destructive hover:bg-destructive/5">
                  <Ban className="h-3.5 w-3.5" /> {ar ? "إلغاء" : "Revoke"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}