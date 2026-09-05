import React, { useRef } from "react";
import { PenLine, ShieldCheck } from "lucide-react";
import PublicSignDocumentPanel from "@/components/files/PublicSignDocumentPanel";
import PublicSignSignaturePanel from "@/components/files/PublicSignSignaturePanel";
import PublicSignRequestSummary from "@/components/files/PublicSignRequestSummary";
import IdentityCard from "@/components/shared/IdentityCard";
import { OK } from "@/lib/platformStyles";

export default function PublicSignWorkspace({ signing, reviewed, onContinue }) {
  const signatureRef = useRef(null);
  const { ar, info, textValues, setTextValue } = signing;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <IdentityCard
        icon={PenLine}
        kicker={reviewed ? (ar ? "مرحلة التوقيع" : "Signature stage") : (ar ? "مرحلة المراجعة" : "Review stage")}
        title={reviewed ? (ar ? "املأ الحقول ووقّع" : "Complete fields and sign") : (ar ? "راجع المستند والطلب" : "Review document and request")}
        subtitle={ar ? `${info.creatorName} أرسل إليك هذا المستند.` : `${info.creatorName} sent you this document.`}
        meta={<span style={OK}><ShieldCheck style={{ width: 12, height: 12, marginInlineEnd: 4, verticalAlign: "middle" }} />{info.signedCount}/{info.totalCount} {ar ? "مكتمل" : "complete"}</span>}
        dir={ar ? "rtl" : "ltr"}
      />
      {!reviewed ? (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          <PublicSignDocumentPanel ar={ar} info={info} textValues={textValues} onTextChange={setTextValue} interactive={false} />
          <PublicSignRequestSummary ar={ar} info={info} onContinue={onContinue} />
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          <PublicSignDocumentPanel ar={ar} info={info} textValues={textValues} onTextChange={setTextValue} onSignatureClick={() => signatureRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })} />
          <div ref={signatureRef}><PublicSignSignaturePanel {...signing} /></div>
        </div>
      )}
    </section>
  );
}
