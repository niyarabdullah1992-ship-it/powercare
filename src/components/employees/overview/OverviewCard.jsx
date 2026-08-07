import React from "react";

// بطاقة عرض موحّدة لأقسام النظرة العامة في الملف الشخصي.
export default function OverviewCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold">
        {Icon && <Icon className="h-4 w-4 text-accent" />} {title}
      </h3>
      {children}
    </section>
  );
}

export function OverviewRow({ label, value, dir }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-sm font-medium" dir={dir}>{value || "—"}</span>
    </div>
  );
}