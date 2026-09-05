import React from "react";
import Logo from "@/components/Logo";
import IdentityCard from "@/components/shared/IdentityCard";
import { MUTED, SURFACE, publicMarkTile, usePublicPlatformTheme } from "@/lib/publicChrome";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  usePublicPlatformTheme();
  return (
    <div className="powercare-public" style={{ minHeight: "100vh", background: SURFACE, color: "var(--nv-ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <span style={{ ...publicMarkTile, width: 44, height: 44, borderRadius: 12, margin: "0 auto" }}>
            <Logo size={30} wordmark={false} />
          </span>
        </div>
        <IdentityCard icon={Icon} title={title} subtitle={subtitle}>
          {children}
        </IdentityCard>
        {footer ? <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: MUTED }}>{footer}</div> : null}
      </div>
    </div>
  );
}
