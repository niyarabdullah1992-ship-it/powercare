import React, { useState, useEffect } from "react";
import { Fingerprint, Loader2, ShieldX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import Logo from "@/components/Logo";
import VerifyDocumentCard from "@/components/files/VerifyDocumentCard";
import IdentityCard from "@/components/shared/IdentityCard";
import { MUTED, NAVY, SURFACE, usePublicPlatformTheme } from "@/lib/publicChrome";

export default function Verify() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id") || "";
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(!!id);
  usePublicPlatformTheme();

  useEffect(() => {
    if (!id) return;
    base44.functions
      .invoke("signedDocs", { action: "lookup", verificationId: id })
      .then((res) => setInfo(res.data))
      .catch(() => setInfo({ found: false }))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="powercare-public" style={{ minHeight: "100vh", background: SURFACE, color: "var(--nv-ink)", padding: "40px 16px" }} dir={ar ? "rtl" : "ltr"}>
      <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Logo size={28} />
        </div>

        {loading && (
          <IdentityCard title={ar ? "جارٍ جلب بيانات التوقيع…" : "Loading signature details…"}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 13 }}>
              <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
            </div>
          </IdentityCard>
        )}

        {!loading && id && info?.found && (
          <IdentityCard icon={Fingerprint} kicker="Encrypted verification ID" title={`${info.signerName} — ${info.signedAt ? new Date(info.signedAt).toLocaleDateString("en-GB") : ""}`} subtitle={info.fileName} dir="ltr" bodySurface>
            <p style={{ margin: 0, fontFamily: "ui-monospace, monospace", fontSize: 16, fontWeight: 600, color: NAVY }} dir="ltr">{info.verificationId}</p>
          </IdentityCard>
        )}

        {!loading && id && info && !info.found && (
          <IdentityCard icon={ShieldX} rail="#DC2626" title={ar ? "رقم التحقق هذا غير موجود في السجل." : "This verification ID does not exist in the registry."} />
        )}

        <VerifyDocumentCard ar={ar} initialId={id} />
      </div>
    </div>
  );
}
