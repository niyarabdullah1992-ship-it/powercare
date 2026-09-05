import React, { useState } from "react";
import { Check, Copy, Fingerprint, LockKeyhole, ShieldCheck, Timer } from "lucide-react";
import SigningPanel from "./SigningPanel";
import { MUTED, NAVY, BORDER, SURFACE, CARD } from "@/lib/platformStyles";

export default function SignatureSecurityBar({ signatureId, timestamp, verified, ar }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!signatureId) return;
    await navigator.clipboard.writeText(signatureId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const formatted = timestamp
    ? new Date(timestamp).toLocaleString(ar ? "ar-SA" : "en-GB", { timeZone: "Asia/Riyadh", dateStyle: "full", timeStyle: "medium" })
    : "—";

  const cell = {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "12px 14px",
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
  };

  if (!verified) {
    return (
      <SigningPanel icon={ShieldCheck} title={ar ? "التحقق بعد التوقيع" : "Verify after signing"}>
        <p style={{ margin: 0, display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, lineHeight: 1.65, color: MUTED }}>
          <ShieldCheck style={{ width: 16, height: 16, color: NAVY, flexShrink: 0, marginTop: 2 }} />
          {ar
            ? "بعد توقيع المستند استخدم تبويب التحقق وارفع النسخة الموقّعة لمطابقة البصمة."
            : "After signing, use the Verify tab and upload the signed copy to match the fingerprint."}
        </p>
      </SigningPanel>
    );
  }

  return (
    <SigningPanel icon={ShieldCheck} title={ar ? "سُجّلت بصمة المستند الموقّع" : "Signed document fingerprint registered"}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
        <div style={cell}>
          <Timer style={{ width: 16, height: 16, color: NAVY, flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: 0, fontSize: 10, color: MUTED }}>{ar ? "الختم الزمني (الرياض)" : "Timestamp (Riyadh)"}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: NAVY }} dir="auto">{formatted}</p>
          </div>
        </div>
        <div style={cell}>
          <Fingerprint style={{ width: 16, height: 16, color: NAVY, flexShrink: 0, marginTop: 2 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 10, color: MUTED }}>{ar ? "معرّف التحقق" : "Verification id"}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: NAVY }} dir="ltr">
              {signatureId || "PWC-••••"}
            </p>
          </div>
          <button
            type="button"
            onClick={copy}
            disabled={!signatureId}
            style={{
              border: `1px solid ${BORDER}`,
              background: CARD,
              borderRadius: 8,
              padding: 6,
              cursor: signatureId ? "pointer" : "default",
            }}
            aria-label={ar ? "نسخ رمز التحقق" : "Copy verification code"}
          >
            {copied ? <Check style={{ width: 14, height: 14, color: "#15803D" }} /> : <Copy style={{ width: 14, height: 14, color: MUTED }} />}
          </button>
        </div>
        <div style={cell}>
          <LockKeyhole style={{ width: 16, height: 16, color: NAVY, flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: 0, fontSize: 10, color: MUTED }}>{ar ? "حماية المحتوى" : "Content protection"}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: NAVY }}>
              {ar ? "بصمة مرتبطة بالمستند وسجل غير قابل للتعديل" : "Fingerprint bound to the document and an immutable record"}
            </p>
          </div>
        </div>
      </div>
    </SigningPanel>
  );
}
