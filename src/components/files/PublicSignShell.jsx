import React from "react";
import { HelpCircle, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { BORDER, CARD, MUTED, NAVY, SURFACE, usePublicPlatformTheme } from "@/lib/publicChrome";

export default function PublicSignShell({ ar, children }) {
  usePublicPlatformTheme();
  return (
    <div className="powercare-public" style={{ minHeight: "100vh", background: SURFACE, color: "var(--nv-ink)" }} dir={ar ? "rtl" : "ltr"}>
      <header style={{ borderBottom: `1px solid ${BORDER}`, background: CARD }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Logo size={28} />
          </div>
          <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED }}>
            <HelpCircle style={{ width: 14, height: 14 }} />
            {ar ? "هل تحتاج مساعدة؟" : "Need signing help?"}
          </p>
        </div>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 20px 28px" }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: MUTED }}>
            {ar ? "طلب توقيع إلكتروني" : "Electronic signature request"}
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 600, color: NAVY, lineHeight: 1.25 }}>
            {ar ? "راجع. أقر. وقّع." : "Review. Confirm. Sign."}
          </h1>
          <p style={{ margin: "8px 0 0", maxWidth: 560, fontSize: 13, lineHeight: 1.6, color: MUTED }}>
            {ar
              ? "اطّلع على المستند ثم وقّعه باسمك وبصفتك. البصمة تُحفظ في سجل المنشأة ويمكن التحقق منها — هذا ليس شهادة حكومية مؤهلة."
              : "Review the document, then sign in your name and capacity. The fingerprint is stored in the company registry and can be verified — this is not a qualified government certificate."}
          </p>
        </div>
      </header>
      <main style={{ maxWidth: 1100, margin: "0 auto", width: "100%", padding: "20px 20px 40px", display: "flex", flexDirection: "column", gap: 16 }}>{children}</main>
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "16px 20px" }}>
        <p style={{ margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 11, color: MUTED }}>
          <ShieldCheck style={{ width: 14, height: 14 }} />
          {ar ? "سجل توقيع إلكتروني داخل المنشأة بواسطة NiroVera" : "In-company electronic signing record by NiroVera"}
        </p>
      </footer>
    </div>
  );
}
