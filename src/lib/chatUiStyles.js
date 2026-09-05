/** Shared chrome for /app/chat — same identity frame as the rest of the app. */
import { identityFrame } from "@/components/shared/IdentityCard";
import { ACCENT, BORDER, BRAND, BRAND_DEEP, BRAND_SOFT, CARD, MUTED, NAVY, NAVY_FILL, SURFACE, field, ui, NEUTRAL } from "@/lib/platformStyles";

export { ACCENT, BORDER, CARD, MUTED, NAVY, NAVY_FILL, SURFACE, field, ui, NEUTRAL };

export const pane = {
  ...identityFrame,
  display: "flex",
  flexDirection: "column",
};

export const paneHeader = {
  padding: "12px 14px",
  borderBottom: `1px solid ${BORDER}`,
  display: "flex",
  alignItems: "center",
  gap: 10,
};

export const channelBtn = (active) => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "10px 12px",
  border: "none",
  borderRadius: 10,
  background: active ? "color-mix(in oklab, #14284B 6%, #F7F8FA)" : "transparent",
  boxShadow: "none",
  color: active ? NAVY : MUTED,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: active ? 600 : 500,
  textAlign: "start",
});

export const filterChip = (active) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 32,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  whiteSpace: "nowrap",
  padding: "0 12px",
  borderRadius: 9,
  lineHeight: 1,
  boxSizing: "border-box",
  ...(active
    ? {
        border: `1px solid ${BRAND}`,
        background: BRAND_SOFT,
        color: BRAND_DEEP,
        fontWeight: 600,
      }
    : {
        border: `1px solid ${BORDER}`,
        background: CARD,
        color: MUTED,
      }),
});

export const tabBtn = (on) => ({
  padding: "6px 11px",
  borderRadius: 8,
  border: "none",
  background: on ? CARD : "transparent",
  boxShadow: on ? "0 1px 2px rgba(20,40,75,.06)" : "none",
  color: on ? NAVY : MUTED,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
});

export const composerInput = {
  ...field,
  flex: 1,
  height: 40,
  borderRadius: 999,
  background: SURFACE,
};

export const iconTile = {
  width: 40,
  height: 40,
  borderRadius: 999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  background: SURFACE,
  color: NAVY,
  border: `1px solid ${BORDER}`,
  fontSize: 13,
  fontWeight: 600,
};
