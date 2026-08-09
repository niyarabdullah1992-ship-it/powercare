import React from "react";

export default function GuideToc({ chapters, label }) {
  return (
    <nav className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{label}</p>
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.map((c, i) => (
          <li key={c.id}>
            <a href={`#${c.id}`} className="block truncate rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <span className="text-accent">{i + 1}.</span> {c.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}