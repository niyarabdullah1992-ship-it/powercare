import React from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Minus, Plus, Scan } from "lucide-react";
import { MUTED, NAVY } from "@/lib/platformStyles";

const strip = {
  display: "inline-flex",
  alignItems: "center",
  height: 34,
  padding: "0 4px",
  borderRadius: 999,
  border: "1px solid #E4E9F0",
  background: "color-mix(in oklab, #14284B 3%, #fff)",
};

const iconBtn = {
  width: 28,
  height: 28,
  padding: 0,
  border: "none",
  borderRadius: 999,
  background: "transparent",
  color: NAVY,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontFamily: "inherit",
};

const divider = {
  width: 1,
  height: 16,
  margin: "0 3px",
  background: "#E4E9F0",
  flexShrink: 0,
};

export default function HierarchyZoomControls({ zoom, onZoom, onSetZoom, onFit, onPan, ar }) {
  const pct = Math.round(zoom * 100);

  return (
    <div dir="ltr" style={strip} role="toolbar" aria-label={ar ? "عرض الشجرة" : "Tree view"}>
      {typeof onPan === "function" && (
        <>
          <button type="button" onClick={() => onPan(120, 0)} style={iconBtn} aria-label={ar ? "يسار" : "Left"}>
            <ArrowLeft style={{ width: 13, height: 13 }} strokeWidth={1.8} />
          </button>
          <button type="button" onClick={() => onPan(-120, 0)} style={iconBtn} aria-label={ar ? "يمين" : "Right"}>
            <ArrowRight style={{ width: 13, height: 13 }} strokeWidth={1.8} />
          </button>
          <button type="button" onClick={() => onPan(0, 120)} style={iconBtn} aria-label={ar ? "أعلى" : "Up"}>
            <ArrowUp style={{ width: 13, height: 13 }} strokeWidth={1.8} />
          </button>
          <button type="button" onClick={() => onPan(0, -120)} style={iconBtn} aria-label={ar ? "أسفل" : "Down"}>
            <ArrowDown style={{ width: 13, height: 13 }} strokeWidth={1.8} />
          </button>
          <span aria-hidden="true" style={divider} />
        </>
      )}

      <button type="button" onClick={() => onZoom(-0.1)} style={iconBtn} aria-label={ar ? "تصغير" : "Zoom out"}>
        <Minus style={{ width: 13, height: 13 }} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        onClick={() => onSetZoom?.(1)}
        title={ar ? "إعادة 100%" : "Reset 100%"}
        style={{
          ...iconBtn,
          width: 42,
          fontSize: 11,
          fontWeight: 600,
          color: MUTED,
          fontFamily: "'IBM Plex Sans', sans-serif",
          letterSpacing: "-0.02em",
        }}
      >
        {pct}%
      </button>
      <button type="button" onClick={() => onZoom(0.1)} style={iconBtn} aria-label={ar ? "تكبير" : "Zoom in"}>
        <Plus style={{ width: 13, height: 13 }} strokeWidth={1.8} />
      </button>

      {typeof onFit === "function" && (
        <>
          <span aria-hidden="true" style={divider} />
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onFit();
            }}
            style={{ ...iconBtn, width: "auto", padding: "0 8px", gap: 5, color: NAVY }}
            aria-label={ar ? "إظهار الكل" : "Fit all"}
            title={ar ? "إظهار الكل داخل الشاشة" : "Fit the whole tree on screen"}
          >
            <Scan style={{ width: 14, height: 14 }} strokeWidth={1.8} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>{ar ? "الكل" : "Fit"}</span>
          </button>
        </>
      )}
    </div>
  );
}
