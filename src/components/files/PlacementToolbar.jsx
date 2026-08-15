import React from "react";
import { PenLine, Type } from "lucide-react";
import { BORDER, MUTED, NAVY, CARD } from "@/lib/platformStyles";

const chip = (active) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 8,
  border: `1px solid ${active ? "#BBF7D0" : BORDER}`,
  background: active ? "#ECFDF3" : CARD,
  color: active ? "#15803D" : NAVY,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
});

export default function PlacementToolbar({ ar, fieldType, setFieldType, signers, spots, active, setActive, colors }) {
  return (
    <div style={{ display: "grid", gap: 10, padding: "10px 14px 12px", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ fontSize: 9, letterSpacing: "0.16em", fontWeight: 600, color: "#1E9E63" }}>NIROVERA</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={() => setFieldType("signature")} style={chip(fieldType === "signature")}>
          <PenLine style={{ width: 14, height: 14 }} />
          {ar ? "حقل توقيع" : "Signature field"}
        </button>
        <button type="button" onClick={() => setFieldType("text")} style={chip(fieldType === "text")}>
          <Type style={{ width: 14, height: 14 }} />
          {ar ? "حقل نص" : "Text field"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
        {signers.map((signer, index) => {
          const signatures = (spots[index] || []).filter((field) => field.type === "signature").length;
          const selected = active === index;
          const color = colors[index % colors.length];
          return (
            <button
              key={signer.email || index}
              type="button"
              onClick={() => setActive(index)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 148,
                padding: "8px 10px",
                borderRadius: 10,
                border: `1px solid ${selected ? "#BBF7D0" : BORDER}`,
                background: selected ? "#F7F8FA" : CARD,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "start",
              }}
            >
              <span style={{
                width: 22,
                height: 22,
                borderRadius: 20,
                background: color,
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              >
                {index + 1}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{signer.name}</span>
                <span style={{ display: "block", marginTop: 2, fontSize: 10, color: MUTED }}>
                  {signatures} {ar ? "توقيع" : "signatures"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
