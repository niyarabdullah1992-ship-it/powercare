import React from "react";

export default function PageHeader({ title, description, icon: Icon, actions }) {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent shadow-sm">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
          )}
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        </div>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground font-body">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}