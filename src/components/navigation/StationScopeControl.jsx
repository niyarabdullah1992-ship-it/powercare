import React from "react";
import { MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import useStationSwitcher, { openStationSwitcher } from "@/hooks/useStationSwitcher";

/**
 * Header station chip — navy pill with pin, as on the Command Center reference.
 */
export default function StationScopeControl() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { stations, scope, scopedStation } = useStationSwitcher();

  const label = scopedStation
    ? scopedStation.name
    : scope !== "all"
      ? String(scope)
      : (ar ? `كل الفروع · ${stations.length}` : `All stations · ${stations.length}`);

  return (
    <button
      type="button"
      onClick={openStationSwitcher}
      title={ar ? "تبديل سريع للفرع · Ctrl+Shift+K" : "Station quick switch · Ctrl+Shift+K"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 36,
        padding: "0 14px",
        borderRadius: 10,
        border: "none",
        background: "#14284B",
        color: "#fff",
        cursor: "pointer",
        fontFamily: "inherit",
        flexShrink: 0,
      }}
    >
      <MapPin style={{ width: 14, height: 14 }} strokeWidth={1.8} />
      <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}
