import React from "react";

export default function ExpenseStats({ claims, ar }) {
  const total = claims.reduce((sum, claim) => sum + Number(claim.totalAmount || claim.amount || 0), 0);
  const cards = [
    [ar ? "إجمالي الطلبات" : "Total claims", claims.length],
    [ar ? "بانتظار المدير" : "Manager review", claims.filter((claim) => claim.status === "submitted").length],
    [ar ? "بانتظار المالية" : "Finance review", claims.filter((claim) => claim.status === "manager_approved").length],
    [ar ? "إجمالي المبالغ" : "Total amount", `${total.toLocaleString()} SAR`],
  ];
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-heading text-2xl font-semibold">{value}</p></div>)}</div>;
}