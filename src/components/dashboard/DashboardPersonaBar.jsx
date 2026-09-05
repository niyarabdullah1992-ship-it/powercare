import React from "react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useOrgTerms } from "@/hooks/useOrgTerms";
import { INK, MUTED } from "@/lib/platformStyles";

/**
 * States whose view the command center is showing — plain meta, not toggles.
 * Persona derives from role/position; facility type is locked at signup.
 */
export default function DashboardPersonaBar({ lang = "ar" }) {
  const ar = lang === "ar";
  const { currentUser, data } = useAuth();
  const { terms } = useOrgTerms();

  const role = currentUser?.role || "employee";
  const persona = (() => {
    if (role === "employee") return "employee";
    if (["station_manager", "pgm"].includes(role)) return "manager";
    if (currentUser?.hrLevelId || role === "ops_manager") return "hr";
    if (["director", "owner"].includes(role) || currentUser?.id === data?.ownerId) return "executive";
    return "hr";
  })();

  const PERSONA_LABEL = {
    employee: { ar: "موظف", en: "Employee" },
    manager: { ar: "مدير مباشر", en: "Line manager" },
    hr: { ar: "موارد بشرية", en: "HR" },
    executive: { ar: "تنفيذي", en: "Executive" },
  };
  const label = PERSONA_LABEL[persona];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px 10px", fontSize: "12px", color: MUTED, lineHeight: 1.55 }}>
      <span>
        {ar ? "العرض بصلاحية" : "Viewing as"}{" "}
        <strong style={{ color: INK, fontWeight: 600 }}>{ar ? label.ar : label.en}</strong>
        {" · "}
        {ar ? "شركة" : terms.orgKindShort}
      </span>
      <span style={{ fontSize: "11px", color: MUTED }}>
        {ar
          ? "مشتقّة من الدور والهيكل — لا تُبدَّل من هنا."
          : "Derived from role and structure — not switched here."}
      </span>
    </div>
  );
}
