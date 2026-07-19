import React from "react";

export default function SafetyMetricCard({ icon: Icon, label, value, sub, tone = "text-foreground", alert = false }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${alert ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <p className={`mt-3 font-heading text-2xl font-semibold leading-none ${tone}`}>{value}</p>
      <p className="mt-1.5 text-xs font-body font-medium text-foreground/80">{label}</p>
      <p className="text-[11px] font-body text-muted-foreground">{sub}</p>
    </div>
  );
}