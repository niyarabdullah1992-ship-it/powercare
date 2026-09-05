import React from "react";
import { MUTED, NAVY, num, cardShell } from "@/lib/platformStyles";

export default function ExpenseStats({ claims, ar }) {
  const total = claims.reduce((sum, claim) => sum + Number(claim.totalAmount || claim.amount || 0), 0);
  const cards = [
    [ar ? "إجمالي الطلبات" : "Total claims", claims.length],
    [ar ? "بانتظار المدير" : "Manager review", claims.filter((claim) => claim.status === "submitted").length],
    [ar ? "بانتظار المالية" : "Finance review", claims.filter((claim) => claim.status === "manager_approved").length],
    [ar ? "إجمالي المبالغ" : "Total amount", `${total.toLocaleString()} SAR`],
  ];
  return (
    <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
      {cards.map(([label, value]) => (
        <div key={label} style={{ ...cardShell, borderRadius: "13px", padding: "15px 16px" }}>
          <p style={{ margin: 0, fontSize: "11px", color: MUTED }}>{label}</p>
          <p style={{ margin: "8px 0 0", ...num(NAVY), fontSize: typeof value === "number" ? "24px" : "18px" }}>{value}</p>
        </div>
      ))}
    </div>
  );
}
