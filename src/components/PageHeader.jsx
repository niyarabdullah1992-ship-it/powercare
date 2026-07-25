import React from "react";

export default function PageHeader({ title, description, icon: Icon, actions }) {
  return (
    <header className="relative flex flex-col gap-4 overflow-hidden rounded-xl border border-accent/40 bg-primary p-5 text-primary-foreground shadow-elevated before:absolute before:inset-y-0 before:start-0 before:w-1 before:bg-accent sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="absolute -end-16 -top-24 h-56 w-56 rounded-full border border-accent/15" />
      <div className="relative min-w-0">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/45 bg-accent/10 text-accent shadow-sm">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
          )}
          <h1 className="font-heading text-2xl font-semibold tracking-tight !text-primary-foreground sm:text-3xl">{title}</h1>
        </div>
        {description && <p className="mt-2 max-w-2xl text-sm text-primary-foreground/70 font-body">{description}</p>}
      </div>
      {actions && <div className="relative flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}