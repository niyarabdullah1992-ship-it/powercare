import React from "react";
import { BORDER, MUTED, CARD } from "@/lib/platformStyles";

export default function StampPreview({ src, sealId, ar }) {
  if (!src) return null;
  return (
    <div>
      <p style={{ margin: "0 0 6px", fontSize: 11, color: MUTED }}>
        {ar ? "معاينة الختم بهوية نيروفيرا" : "NiroVera seal preview"}
      </p>
      <img
        src={src}
        alt={ar ? "معاينة الختم الرقمي" : "Digital stamp preview"}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          borderRadius: 10,
          border: `1px solid ${BORDER}`,
          background: CARD,
        }}
      />
      {sealId ? (
        <p
          dir="ltr"
          style={{
            margin: "6px 0 0",
            fontSize: 11,
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
            color: MUTED,
            textAlign: "center",
            letterSpacing: "0.04em",
            fontWeight: 600,
          }}
        >
          {sealId}
        </p>
      ) : null}
    </div>
  );
}
