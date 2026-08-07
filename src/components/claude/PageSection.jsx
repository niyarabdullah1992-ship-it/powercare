import React from "react";

/**
 * Calm Claude-style page section: one purpose, one title, short support line.
 */
export default function PageSection({
  eyebrow,
  title,
  description,
  action,
  children,
  className = "",
}) {
  return (
    <section className={`space-y-4 ${className}`}>
      {(eyebrow || title || description || action) && (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-1.5">
            {eyebrow ? (
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground md:text-[1.75rem]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-sm leading-7 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}
