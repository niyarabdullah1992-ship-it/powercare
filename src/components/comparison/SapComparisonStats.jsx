import React from "react";

export default function SapComparisonStats({ stats }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <article key={stat.label} className="overflow-hidden rounded-lg border border-accent/30 bg-card text-center">
          <div className="grid grid-cols-2"><div className="bg-red-50 p-4"><p className="text-[10px] text-red-700">SAP</p><strong className="font-heading text-2xl text-red-900">{stat.sap}</strong></div><div className="bg-emerald-50 p-4"><p className="text-[10px] text-emerald-700">POWERCARE</p><strong className="font-heading text-2xl text-emerald-900">{stat.powercare}</strong></div></div>
          <div className="p-4"><h3 className="font-bold text-primary">{stat.label}</h3><p className="mt-1 text-[10px] leading-5 text-muted-foreground">{stat.note}</p></div>
        </article>
      ))}
    </div>
  );
}