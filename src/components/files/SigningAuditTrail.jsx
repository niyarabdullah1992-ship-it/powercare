import React from "react";
import { CheckCircle2, Clock3, FilePlus2, MapPin, XCircle } from "lucide-react";
import { BORDER, MUTED, NAVY, SURFACE } from "@/lib/platformStyles";

const icons = { created: FilePlus2, signed: CheckCircle2, rejected: XCircle };
const typeLabel = {
  created: { ar: "أُنشئ", en: "Created" },
  signed: { ar: "وُقّع", en: "Signed" },
  rejected: { ar: "رُفض", en: "Rejected" },
};

export default function SigningAuditTrail({ events = [], ar }) {
  if (!events.length) return null;
  return (
    <details style={{ marginTop: 10, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px" }}>
      <summary style={{ cursor: "pointer", listStyle: "none", fontSize: 11, fontWeight: 600, color: NAVY }}>
        {ar ? "سجل التدقيق" : "Audit trail"}
      </summary>
      <div style={{ marginTop: 10, paddingInlineStart: 12, borderInlineStart: `2px solid ${BORDER}`, display: "grid", gap: 10 }}>
        {events.map((event, index) => {
          const Icon = icons[event.type] || Clock3;
          const label = typeLabel[event.type];
          return (
            <div key={`${event.at}-${index}`} style={{ fontSize: 11 }}>
              <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 6, color: NAVY }}>
                <Icon style={{ width: 13, height: 13, color: event.type === "signed" ? "#15803D" : event.type === "rejected" ? "#DC2626" : NAVY }} />
                {event.actorName || "NiroVera"} · {label ? (ar ? label.ar : label.en) : event.type}
              </p>
              <p style={{ margin: "4px 0 0", color: MUTED }}>
                {new Date(event.at).toLocaleString(ar ? "ar-SA" : "en-GB", { timeZone: "Asia/Riyadh" })}
              </p>
              {event.location?.lat != null && (
                <p style={{ margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4, color: MUTED }}>
                  <MapPin style={{ width: 12, height: 12 }} />
                  {event.location.lat.toFixed(5)}, {event.location.lng.toFixed(5)} ±{Math.round(event.location.accuracy || 0)}m
                </p>
              )}
              {event.documentHash && (
                <p dir="ltr" style={{ margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: MUTED }}>
                  SHA-256 {event.documentHash}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}
