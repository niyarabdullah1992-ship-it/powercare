import { BORDER, CARD, MUTED, NAVY, NAVY_FILL, SURFACE } from "@/lib/platformStyles";

export const ORG_GREEN = "hsl(154 79% 27%)";
export const ORG_AMBER = "hsl(41 62% 38%)";

export const orgPanelShell = (fullscreen = false) => (fullscreen
  ? {
      position: "fixed",
      inset: 0,
      zIndex: 400,
      width: "100vw",
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: CARD,
      overflow: "hidden",
    }
  : {
      width: "100%",
      background: CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: 12,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 1px 3px rgba(20,40,75,.04)",
    });

export const orgInput = {
  height: 34,
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  padding: "0 11px",
  fontSize: 12,
  fontFamily: "inherit",
  background: CARD,
  color: NAVY,
  minWidth: 0,
};

export const orgSelect = {
  ...orgInput,
  padding: "0 9px",
};

export const orgBtnGhost = {
  all: "unset",
  cursor: "pointer",
  height: 34,
  padding: "0 12px",
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  background: CARD,
  color: NAVY,
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "inherit",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

export const orgBtnPrimary = (disabled = false) => ({
  ...orgBtnGhost,
  background: disabled ? SURFACE : ORG_GREEN,
  border: `1px solid ${disabled ? BORDER : ORG_GREEN}`,
  color: disabled ? MUTED : "#fff",
  cursor: disabled ? "not-allowed" : "pointer",
});

export const orgBtnDanger = {
  ...orgBtnGhost,
  color: "hsl(0 65% 42%)",
  border: "1px solid hsl(0 55% 82%)",
};

export const orgInspectorLabel = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.04em",
  color: MUTED,
  textTransform: "uppercase",
};

export const orgFieldLabel = orgInspectorLabel;
