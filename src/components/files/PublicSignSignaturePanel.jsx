import React from "react";
import { Keyboard, Loader2, PenLine, ShieldCheck, XCircle } from "lucide-react";
import SignaturePad from "@/components/files/SignaturePad";
import TypedSignature from "@/components/files/TypedSignature";
import IdentityCard, { identityIconWrap } from "@/components/shared/IdentityCard";
import { BORDER, DANGER, MUTED, NAVY, NAVY_FILL, SURFACE, textarea, ui, CARD } from "@/lib/platformStyles";
import { OFFICIAL_STAMP_THEME } from "@/lib/signatureStampThemes";

export default function PublicSignSignaturePanel({ ar, info, mode, setMode, stampPreview, setStampPreview, sign, reject, signing, stage, error }) {
  const [showReject, setShowReject] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [intent, setIntent] = React.useState(false);
  const confirmSign = (...args) => {
    if (!intent) return;
    sign(...args);
  };
  const tab = (active) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 9,
    padding: "8px 6px",
    fontSize: 12,
    fontWeight: 600,
    border: 0,
    cursor: "pointer",
    background: active ? CARD : "transparent",
    color: active ? NAVY : MUTED,
    boxShadow: active ? "0 1px 2px rgba(20,40,75,.08)" : "none",
    fontFamily: "inherit",
  });

  return (
    <IdentityCard
      icon={PenLine}
      kicker={ar ? "الموقّع" : "Signer"}
      title={info.signer.name}
      dir={ar ? "rtl" : "ltr"}
      bodySurface
      meta={(
        <span style={{ ...identityIconWrap, width: 36, height: 36, borderRadius: "50%", fontSize: 14, fontWeight: 600, color: "#fff", background: NAVY_FILL }}>
          {info.signer.name?.charAt(0)}
        </span>
      )}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 4, borderRadius: 12, background: SURFACE, padding: 4, marginBottom: 14 }}>
        <button type="button" onClick={() => { setShowReject(false); setMode("type"); setStampPreview(""); }} style={tab(!showReject && mode === "type")}>
          <Keyboard style={{ width: 14, height: 14 }} />{ar ? "كتابة الاسم" : "Type name"}
        </button>
        <button type="button" onClick={() => { setShowReject(false); setMode("draw"); setStampPreview(""); }} style={tab(!showReject && mode === "draw")}>
          <PenLine style={{ width: 14, height: 14 }} />{ar ? "رسم التوقيع" : "Draw"}
        </button>
        <button type="button" onClick={() => { setShowReject(true); setStampPreview(""); }} style={{ ...tab(showReject), color: showReject ? DANGER : MUTED }}>
          <XCircle style={{ width: 14, height: 14 }} />{ar ? "الامتناع" : "Decline"}
        </button>
      </div>
      {showReject ? (
        <div style={{ borderRadius: 12, border: "1px solid #FECACA", background: "#FEF2F2", padding: 14 }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: DANGER }}>
            {ar ? "اكتب سبب الامتناع عن التوقيع، وسيُحفظ مع سجل الطلب." : "Enter why you decline to sign; the reason will be saved with the request record."}
          </p>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={ar ? "سبب الامتناع عن التوقيع" : "Reason for declining to sign"}
            style={{ ...textarea, minHeight: 96, marginTop: 10 }}
          />
          <button type="button" onClick={() => reject(reason)} disabled={!reason.trim() || signing} style={{ ...ui.btnBlock, background: DANGER, opacity: !reason.trim() || signing ? 0.4 : 1 }}>
            {ar ? "تأكيد الامتناع عن التوقيع" : "Confirm decline to sign"}
          </button>
        </div>
      ) : (
        <>
          <p style={{ margin: 0, borderRadius: 12, border: `1px solid ${BORDER}`, background: CARD, padding: "10px 12px", fontSize: 12, lineHeight: 1.55, color: MUTED }}>
            {ar ? "سيُثبت توقيعك داخل الحقل الذي حدده المُرسِل ولن يتجاوز حدوده." : "Your signature will be fixed inside the field assigned by the sender."}
          </p>
          <label style={{ marginTop: 12, display: "flex", cursor: "pointer", alignItems: "flex-start", gap: 8, borderRadius: 12, border: `1px solid ${BORDER}`, background: CARD, padding: 12, fontSize: 11, lineHeight: 1.55, color: MUTED }}>
            <input type="checkbox" checked={intent} onChange={(e) => setIntent(e.target.checked)} style={{ marginTop: 2 }} />
            {ar ? "أقر بأنني اطّلعت على المستند وأوقّعه بإرادتي، باسمِي، وفق نظام التعاملات الإلكترونية." : "I confirm that I reviewed this document and sign it of my own will, in my name, under the Electronic Transactions Law."}
          </label>
          {info.signer.signatureUrl ? (
            <button type="button" onClick={() => confirmSign(info.signer.signatureUrl)} disabled={signing || !intent} style={{ ...ui.btnBlock, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: signing || !intent ? 0.4 : 1 }}>
              <ShieldCheck style={{ width: 16, height: 16 }} />
              {ar ? "استخدام توقيعي المعتمد من ملف HR" : "Use my HR-approved signature"}
            </button>
          ) : null}
          {mode === "type"
            ? <TypedSignature ar={ar} defaultName={info.signer.name || ""} verificationId={info.verificationId} stampTheme={OFFICIAL_STAMP_THEME} onPreview={setStampPreview} onSave={confirmSign} saving={signing} />
            : <SignaturePad ar={ar} signerName={info.signer.name || ""} verificationId={info.verificationId} stampTheme={OFFICIAL_STAMP_THEME} onPreview={setStampPreview} onSave={confirmSign} saving={signing} />}
        </>
      )}
      {signing ? (
        <p style={{ margin: "12px 0 0", display: "flex", alignItems: "center", gap: 8, borderRadius: 12, background: CARD, border: `1px solid ${BORDER}`, padding: "10px 12px", fontSize: 12, color: MUTED }}>
          <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />{stage}
        </p>
      ) : null}
      {error ? (
        <p style={{ margin: "12px 0 0", borderRadius: 12, background: "#FEF2F2", padding: "10px 12px", fontSize: 12, color: DANGER }}>{error}</p>
      ) : null}
    </IdentityCard>
  );
}
