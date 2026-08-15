import React from "react";
import { Clock3 } from "lucide-react";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import { ACCENT, BORDER, MUTED, SURFACE } from "@/lib/platformStyles";

const segment = (active) => ({
  height: "26px",
  minWidth: "34px",
  padding: "0 9px",
  border: "none",
  borderRadius: "7px",
  background: active ? ACCENT : "transparent",
  color: active ? "#fff" : MUTED,
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
});

export default function TimeFormatToggle({ lang }) {
  const { format, setFormat } = useTimeFormat();
  const ar = lang === "ar";

  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        flexShrink: 0,
        height: "34px",
        padding: "0 5px",
        borderRadius: "9px",
        border: `1px solid ${BORDER}`,
        background: SURFACE,
      }}
    >
      <Clock3 style={{ width: 13, height: 13, color: MUTED, marginInlineStart: "5px" }} />
      <span style={{ fontSize: "11px", color: MUTED }}>{ar ? "نظام الساعة" : "Time format"}</span>
      {["12", "24"].map((value) => (
        <button key={value} type="button" dir="ltr" onClick={() => setFormat(value)} style={segment(format === value)}>
          {value}
        </button>
      ))}
    </div>
  );
}
