import React, { useState, useEffect } from "react";
import { Fingerprint, Loader2, ShieldX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import Logo from "@/components/Logo";
import VerifyDocumentCard from "@/components/files/VerifyDocumentCard";

// Public document-verification page — opened by scanning the badge QR code
// (/verify?id=PWC-XXXX-XXXX-XXXX). Shows the signature details and lets anyone
// upload the document to compare its SHA-256 hash against the registry.
export default function Verify() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id") || "";
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    base44.functions
      .invoke("signedDocs", { action: "lookup", verificationId: id })
      .then((res) => setInfo(res.data))
      .catch(() => setInfo({ found: false }))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div>
            <h1 className="font-heading text-2xl font-semibold">
              {ar ? "التحقق من توقيع المستندات" : "Document Signature Verification"}
            </h1>
            <p className="text-xs text-muted-foreground font-body">
              {ar ? "منصة PowerCare للتوثيق الرقمي" : "PowerCare digital verification"}
            </p>
          </div>
        </div>

        {loading && (
          <div className="p-5 rounded-xl border border-border bg-card flex items-center gap-2 text-sm text-muted-foreground font-body">
            <Loader2 className="w-4 h-4 animate-spin" /> {ar ? "جارٍ جلب بيانات التوقيع…" : "Loading signature details…"}
          </div>
        )}

        {/* Signature details from the QR's verification ID */}
        {!loading && id && info?.found && (
          <div className="p-5 rounded-xl border-2 border-[#b07d3f]/60 bg-[#faf6ef] flex items-center gap-4">
            <Fingerprint className="w-10 h-10 text-[#b07d3f] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-[#8a7d6a] font-body">Encrypted verification ID</p>
              <p className="font-mono font-semibold text-lg text-[#2b2418]" dir="ltr">{info.verificationId}</p>
              <p className="text-sm font-semibold text-[#2b2418] font-body">
                {info.signerName} — {info.signedAt ? new Date(info.signedAt).toLocaleDateString("en-GB") : ""}
              </p>
              {info.fileName && <p className="text-xs text-[#8a7d6a] font-body truncate">{info.fileName}</p>}
            </div>
          </div>
        )}

        {!loading && id && info && !info.found && (
          <div className="p-4 rounded-xl border border-red-300 bg-red-50 flex items-center gap-2">
            <ShieldX className="w-4 h-4 text-red-700 shrink-0" />
            <p className="text-sm text-red-800 font-body">
              {ar ? "رقم التحقق هذا غير موجود في السجل." : "This verification ID does not exist in the registry."}
            </p>
          </div>
        )}

        {/* Upload the document → recompute SHA-256 → VALID / TAMPERED */}
        <VerifyDocumentCard ar={ar} initialId={id} />
      </div>
    </div>
  );
}