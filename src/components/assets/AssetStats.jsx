import React from "react";
import { Boxes, UserCheck, PowerOff, Wallet } from "lucide-react";

export default function AssetStats({ assets, lang }) {
  const inCustody = assets.filter((a) => a.status === "in_custody").length;
  const outOfService = assets.filter((a) => ["maintenance", "lost", "retired"].includes(a.status)).length;
  const bookValue = assets.filter((a) => a.status !== "retired").reduce((sum, a) => sum + (Number(a.value) || 0), 0);

  const cards = [
    { icon: Boxes, label: lang === "ar" ? "إجمالي الأصول" : "Total assets", value: assets.length },
    { icon: UserCheck, label: lang === "ar" ? "في العهدة" : "In custody", value: inCustody },
    { icon: PowerOff, label: lang === "ar" ? "خارج الخدمة" : "Out of service", value: outOfService },
    { icon: Wallet, label: lang === "ar" ? "القيمة الدفترية" : "Book value", value: bookValue.toLocaleString("en-US") },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-[10px] border border-border bg-card p-3 shadow-soft">
          <span className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center">
            <c.icon className="w-4 h-4" strokeWidth={1.75} />
          </span>
          <p className="mt-2 text-xl font-display font-semibold tabular-nums">{c.value}</p>
          <p className="text-xs text-muted-foreground font-body">{c.label}</p>
        </div>
      ))}
    </div>
  );
}