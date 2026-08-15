import React from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { NAVY, CARD } from "@/lib/platformStyles";

export default function OrgTreeFullscreenButton({ active, onToggle, ar }) {
  const Icon = active ? Minimize2 : Maximize2;
  return (
    <button
      type="button"
      onClick={() => onToggle(!active)}
      title={active ? (ar ? "خروج من ملء الشاشة" : "Exit full screen") : (ar ? "ملء الشاشة" : "Full screen")}
      aria-pressed={active}
      aria-label={active ? (ar ? "خروج من ملء الشاشة" : "Exit full screen") : (ar ? "ملء الشاشة" : "Full screen")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 34,
        padding: "0 10px",
        borderRadius: 9,
        border: `1px solid ${active ? "#14284B" : "#E2E8F0"}`,
        background: active ? "#14284B" : CARD,
        color: active ? "#fff" : NAVY,
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      <Icon style={{ width: 14, height: 14 }} strokeWidth={1.8} />
      {active ? (ar ? "خروج" : "Exit") : (ar ? "ملء الشاشة" : "Full screen")}
    </button>
  );
}
