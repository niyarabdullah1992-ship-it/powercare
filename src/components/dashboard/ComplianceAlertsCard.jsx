import React from "react";

// «تنبيهات الامتثال» — نقاط حمراء/كهرمانية ببيانات حية من الغياب والمهام والطلبات.
export default function ComplianceAlertsCard({ items, lang }) {
  const ar = lang === "ar";
  const visible = items.filter((item) => item.count > 0);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-heading text-base font-semibold mb-3">{ar ? "تنبيهات الامتثال" : "Compliance alerts"}</h3>
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{ar ? "لا توجد تنبيهات حالياً — الالتزام مكتمل." : "No alerts — fully compliant."}</p>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm font-body">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.level === "red" ? "bg-destructive" : "bg-amber-500"}`} />
              <span className="text-foreground/85">{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}