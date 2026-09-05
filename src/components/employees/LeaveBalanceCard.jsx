import React from "react";
import { useI18n } from "@/lib/i18n";
import { getLeaveTotal, usedLeaveDays, leaveTypesForProfile } from "@/lib/leaveTypes";
import { ACCENT, MUTED, NAVY, bar, cardShell } from "@/lib/platformStyles";

/** Platform isTabLeave balances — L2695–2710 */
export default function LeaveBalanceCard({ profile, requests }) {
  const { t, lang } = useI18n();
  const ar = lang === "ar";

  const items = leaveTypesForProfile(profile).filter((ty) => ty.key !== "unpaid").map((ty) => {
    const total = getLeaveTotal(profile, ty.key);
    const used = usedLeaveDays(requests, ty.key);
    const p = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
    return {
      key: ty.key,
      label: t(ty.key),
      used: total != null ? `${used}/${total}` : `${used}`,
      barStyle: bar(total != null ? (p || 2) : 2, p >= 90 ? "#DC2626" : p >= 70 ? "#F59E0B" : ACCENT),
    };
  });

  return (
    <div style={cardShell} dir={ar ? "rtl" : "ltr"}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
        {ar ? "أرصدة الإجازات النظامية" : "Statutory leave balances"}
      </div>
      <div style={{ fontSize: "11px", color: MUTED, marginTop: "4px", lineHeight: 1.6, textWrap: "pretty" }}>
        {ar
          ? "الأرصدة وفق نظام العمل (المادة 109 وما يليها): 21 يومًا سنويًا، و30 بعد خمس سنوات. يُخصم الرصيد عند الاعتماد فقط."
          : "Balances follow the Labour Law (Art. 109+): 21 days annual leave, 30 after five years. Days are deducted only on approval."}
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
        gap: "16px",
        marginTop: "18px",
      }}
      >
        {items.map((l) => (
          <div key={l.key}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px" }}>
              <span style={{ fontSize: "13px", color: NAVY }}>{l.label}</span>
              <span dir="ltr" style={{ fontSize: "12px", fontFamily: "'IBM Plex Sans',sans-serif", color: MUTED }}>
                {l.used}
              </span>
            </div>
            <div style={{ height: "6px", borderRadius: "5px", background: "#F1F5F9", overflow: "hidden", marginTop: "8px" }}>
              <span style={l.barStyle} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
