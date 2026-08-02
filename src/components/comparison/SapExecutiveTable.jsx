import React from "react";

export default function SapExecutiveTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-lg border border-accent/35 bg-card">
      <div className="grid grid-cols-[.8fr_1.2fr_1.2fr] bg-primary px-4 py-3 text-xs font-bold text-primary-foreground"><span>المعيار</span><span>تجربة SAP التقليدية</span><span className="text-accent">PowerCare</span></div>
      {rows.map(([label, sap, powercare]) => (
        <div key={label} className="grid grid-cols-[.8fr_1.2fr_1.2fr] border-t border-border px-4 py-3 text-xs leading-6">
          <strong>{label}</strong><span className="text-muted-foreground">{sap}</span><span className="font-semibold text-emerald-800">{powercare}</span>
        </div>
      ))}
    </div>
  );
}