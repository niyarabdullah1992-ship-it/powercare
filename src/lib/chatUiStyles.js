/** Shared chrome for /app/chat — same identity frame as the rest of the app. */
import { identityFrame } from "@/components/shared/IdentityCard";
import { ACCENT, BORDER, CARD, MUTED, NAVY, SURFACE, field, ui, NEUTRAL } from "@/lib/platformStyles";

export { ACCENT, BORDER, CARD, MUTED, NAVY, SURFACE, field, ui, NEUTRAL };

export const pane = {
  ...identityFrame,
  display: "flex",
  flexDirection: "column",
};

export const paneHeader = {
  padding: "14px 16px",
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
  borderRadius: 8,
  background: active ? CARD : "transparent",
  boxShadow: active ? "0 1px 2px rgba(20,40,75,.06)" : "none",
  color: active ? NAVY : MUTED,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: active ? 600 : 500,
  textAlign: "start",
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
};

export const iconTile = {
  width: 36,
  height: 36,
  borderRadius: 9,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  background: SURFACE,
  color: NAVY,
};
