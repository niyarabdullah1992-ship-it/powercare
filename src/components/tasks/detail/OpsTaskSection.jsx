import React from "react";
import { BORDER, CARD, MUTED } from "@/lib/platformStyles";

/** Uniform section card inside the task detail — title, optional count/aside, body. */
export default function OpsTaskSection({ title, count, aside, tone, children }) {
  const tones = {
    warn: { border: "#FDE68A", background: "#FFFBEB", title: "#B45309" },
    ok: { border: "#BBF7D0", background: "#ECFDF3", title: "#15803D" },
    bad: { border: "#FECACA", background: "#FEF2F2", title: "#B91C1C" },
  };
  const c = tones[tone] || { border: BORDER, background: CARD, title: MUTED };
  return (
    <section style={{ border: `1px solid ${c.border}`, background: c.background, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: `1px solid ${c.border}` }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: c.title, flex: 1 }}>{title}</span>
        {count != null && (
          <span dir="ltr" style={{ fontSize: 11, color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif" }}>{count}</span>
        )}
        {aside}
      </div>
      <div style={{ padding: "12px 14px" }}>{children}</div>
    </section>
  );
}