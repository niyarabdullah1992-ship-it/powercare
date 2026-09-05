import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { MUTED, NAVY, SURFACE, usePublicPlatformTheme } from "@/lib/publicChrome";

/** Public paper chrome for legal / trust pages — not landing cinema. */
export default function PublicPaperShell({ dir = "rtl", maxWidth = 768, children }) {
  usePublicPlatformTheme();
  return (
    <div className="powercare-public" style={{ minHeight: "100vh", background: SURFACE, color: "var(--nv-ink)", padding: "40px 16px" }} dir={dir}>
      <div style={{ maxWidth, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", color: NAVY, width: "fit-content" }}>
          <Logo size={28} />
        </Link>
        {children}
      </div>
    </div>
  );
}

export const legalCopy = {
  wrap: { display: "flex", flexDirection: "column", gap: 12, fontSize: 13, lineHeight: 1.7, color: MUTED },
  h2: { margin: "8px 0 0", fontSize: 16, fontWeight: 600, color: NAVY },
  hr: { border: 0, borderTop: "1px solid var(--nv-line, #E2E8F0)", margin: "8px 0" },
  en: { margin: 0, fontSize: 11, color: MUTED },
};
