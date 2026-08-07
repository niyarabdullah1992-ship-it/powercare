import React, { useEffect, useState } from "react";
import { Loader2, ShieldX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import Logo from "@/components/Logo";
import PublicProofReport from "@/components/proof/PublicProofReport";
import { proofContentHash } from "@/lib/clientProof";

// Public client-facing proof page — opened from the shared link or QR
// (/proof?id=NV-XXXX-XXXX-XXXX).
export default function ProofVerify() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const id = new URLSearchParams(window.location.search).get("id") || "";
  const [info, setInfo] = useState(null);
  const [hashMatches, setHashMatches] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    base44.functions
      .invoke("clientProof", { action: "lookup", proofId: id })
      .then(async (res) => {
        const found = res.data;
        setInfo(found);
        if (found?.found && !found.revoked) {
          const recomputed = await proofContentHash(found.payload || { items: [] });
          setHashMatches(recomputed === found.contentHash);
        }
      })
      .catch(() => setInfo({ found: false }))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="powercare-public min-h-screen bg-landing-cinema px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div>
            <h1 className="font-heading text-2xl font-semibold">{ar ? "التحقق من إثبات العمل" : "Work Proof Verification"}</h1>
            <p className="text-xs text-white/50 font-body">{ar ? "منصة NiroVera للتوثيق الميداني" : "NiroVera field verification"}</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground font-body">
            <Loader2 className="h-4 w-4 animate-spin" /> {ar ? "جارٍ جلب الإثبات…" : "Loading proof…"}
          </div>
        )}

        {!loading && (!id || info?.found === false) && (
          <div className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 p-4">
            <ShieldX className="h-4 w-4 shrink-0 text-red-700" />
            <p className="text-sm text-red-800 font-body">{ar ? "رقم الإثبات غير موجود في السجل." : "This proof reference does not exist in the registry."}</p>
          </div>
        )}

        {!loading && info?.found && info.revoked && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <ShieldX className="h-4 w-4 shrink-0 text-amber-700" />
            <p className="text-sm text-amber-800 font-body">{ar ? "تم سحب هذا الإثبات من قبل الجهة المُصدِرة." : "This proof was withdrawn by the issuer."}</p>
          </div>
        )}

        {!loading && info?.found && !info.revoked && <PublicProofReport info={info} hashMatches={hashMatches} ar={ar} />}
      </div>
    </div>
  );
}