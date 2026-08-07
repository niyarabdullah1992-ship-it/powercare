import React from "react";

// The one empty state: what happened, when data will appear, one action.
export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-10 text-center">
      <p className="font-heading text-base font-semibold text-foreground">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}