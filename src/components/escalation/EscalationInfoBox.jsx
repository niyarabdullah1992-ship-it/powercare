import React from "react";
import { Info } from "lucide-react";
import { ACCENT, MUTED } from "@/lib/platformStyles";

export default function EscalationInfoBox({ t }) {
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: "12px",
      border: "1px solid color-mix(in oklab, #1E9E63 28%, #fff)",
      background: "color-mix(in oklab, #1E9E63 8%, #fff)",
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
    }}
    >
      <Info style={{ width: 16, height: 16, color: ACCENT, flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#14683F" }}>{t("escalationInfoTitle")}</p>
        <p style={{ margin: "4px 0 0", fontSize: "11px", color: MUTED, lineHeight: 1.65 }}>{t("escalationInfoText")}</p>
      </div>
    </div>
  );
}
