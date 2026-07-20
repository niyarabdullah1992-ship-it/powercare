import React from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";

// "Pending Attendance Actions"-style panel: rows with an icon chip, a label,
// a count, and a gold action button linking to the relevant page.
export default function PendingActionsPanel({ items, t }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold">{t("pendingActions")}</h3>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
              <item.icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-body font-medium">{item.label}</p>
              {item.count > 0 && <p className="text-xs font-body text-muted-foreground">{item.count}</p>}
            </div>
            <Link
              to={item.to}
              className="shrink-0 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1.5 text-xs font-body font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              ✓ {t("viewDetails")}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}