import React, { useState } from "react";
import { Check, CheckCircle2, Copy } from "lucide-react";
import IdentityCard from "@/components/shared/IdentityCard";
import { BORDER, MUTED, NAVY, SURFACE, ui } from "@/lib/platformStyles";

export default function GroupSignSuccess({ ar, result, onReset }) {
  const [copied, setCopied] = useState("");
  const copy = (email, link) => {
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(email);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <IdentityCard
      icon={CheckCircle2}
      title={ar ? "أُرسل طلب التوقيع" : "Signature request sent"}
      subtitle={ar ? "رابط مستقل لكل موقّع. انسخه إن لم يصل البريد." : "A separate link for each signer. Copy it if email does not arrive."}
      meta={result?.verificationId ? (
        <span dir="ltr" style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: MUTED }}>
          {result.verificationId}
        </span>
      ) : null}
    >
      <div style={{ display: "grid", gap: 8 }}>
        {Object.entries(result.links || {}).map(([email, link]) => (
          <div key={email} style={{ display: "flex", alignItems: "center", gap: 8, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 10px" }}>
            <span dir="ltr" style={{ minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", fontSize: 12, color: NAVY }}>{email}</span>
            <button type="button" onClick={() => copy(email, link)} style={{ ...ui.btnGhost, display: "inline-flex", alignItems: "center", gap: 4 }}>
              {copied === email ? <Check style={{ width: 12, height: 12, color: "#15803D" }} /> : <Copy style={{ width: 12, height: 12 }} />}
              {ar ? "نسخ" : "Copy"}
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={onReset} style={{ ...ui.btnPrimary, marginTop: 14 }}>
        {ar ? "طلب جديد" : "New request"}
      </button>
    </IdentityCard>
  );
}
