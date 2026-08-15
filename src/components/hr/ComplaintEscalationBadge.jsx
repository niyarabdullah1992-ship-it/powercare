import React from "react";
import { Flag, Plus } from "lucide-react";
import { ACCENT, CARD } from "@/lib/platformStyles";

export default function ComplaintEscalationBadge({ level, canManage, ar, onToggle, sharedLabel = "" }) {
  if (!level && !canManage) return null;
  const label = level
    ? (sharedLabel || (ar ? `تصعيد ${level}` : `Escalation ${level}`))
    : "";
  const help = level
    ? (sharedLabel
      ? (ar
        ? `${sharedLabel} — اضغط لتغيير الرقم أو عدد الفروع.`
        : `${sharedLabel} — click to change the rank or how many branches it holds.`)
      : (ar ? `تصعيد ${level} — اضغط لتحديد كم فرعًا يمسك.` : `Escalation ${level} — click to set how many branches it holds.`))
    : (ar ? "أضف هذا الشخص وحدّد رقم التصعيد وكم فرعًا يمسك." : "Add this person and set the rank plus how many branches it holds.");

  return (
    <button
      type="button"
      disabled={!canManage}
      title={help}
      aria-label={help}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        if (canManage) onToggle();
      }}
      style={{
        position: "absolute",
        insetInlineEnd: 8,
        top: -11,
        zIndex: 10,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: level ? 22 : 22,
        minWidth: 22,
        padding: level ? "0 9px" : 0,
        justifyContent: "center",
        borderRadius: 999,
        border: level
          ? "1px solid transparent"
          : `1px dashed color-mix(in oklab, ${ACCENT} 45%, #fff)`,
        background: level ? ACCENT : CARD,
        color: level ? "#fff" : "#14683F",
        fontSize: 10,
        fontWeight: 600,
        boxShadow: level ? "0 6px 14px color-mix(in oklab, #1E9E63 28%, transparent)" : "0 2px 6px rgba(20,40,75,.06)",
        whiteSpace: "nowrap",
        maxWidth: 168,
        overflow: "hidden",
        textOverflow: "ellipsis",
        cursor: canManage ? "pointer" : "help",
        fontFamily: "inherit",
      }}
    >
      {level
        ? <Flag style={{ width: 10, height: 10 }} strokeWidth={2} />
        : <Plus style={{ width: 12, height: 12 }} strokeWidth={2} />}
      {level ? label : null}
    </button>
  );
}
