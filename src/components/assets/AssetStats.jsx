import React from "react";
import { Boxes, UserCheck, PowerOff, Wallet } from "lucide-react";
import { MUTED, NAVY, SURFACE, BORDER, CARD, num } from "@/lib/platformStyles";

const iconWrap = {
  width: 32,
  height: 32,
  borderRadius: 9,
  background: SURFACE,
  color: NAVY,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export default function AssetStats({ assets, lang }) {
  const ar = lang === "ar";
  const inCustody = assets.filter((a) => a.status === "in_custody").length;
  const outOfService = assets.filter((a) => ["maintenance", "lost", "retired"].includes(a.status)).length;
  const bookValue = assets
    .filter((a) => a.status !== "retired")
    .reduce((sum, a) => sum + (Number(a.value) || 0), 0);

  const cards = [
    { icon: Boxes, label: ar ? "إجمالي الأصول" : "Total assets", value: assets.length },
    { icon: UserCheck, label: ar ? "في العهدة" : "In custody", value: inCustody },
    { icon: PowerOff, label: ar ? "خارج الخدمة" : "Out of service", value: outOfService },
    {
      icon: Wallet,
      label: ar ? "القيمة الدفترية" : "Book value",
      value: bookValue.toLocaleString(ar ? "ar-SA" : "en-US"),
      money: true,
    },
  ];

  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 13,
            padding: "14px 16px",
            boxShadow: "0 4px 14px rgba(20,40,75,.04)",
          }}
        >
          <span style={iconWrap}>
            <card.icon size={15} strokeWidth={1.75} />
          </span>
          <p style={{ margin: "10px 0 0", ...num(NAVY), fontSize: card.money ? 18 : 22 }}>{card.value}</p>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: MUTED, fontWeight: 500 }}>{card.label}</p>
        </div>
      ))}
    </div>
  );
}
