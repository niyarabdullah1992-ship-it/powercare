import React from "react";

// عنوان صغير يفصل مجموعات الحقول داخل اللوحة — بلا صفحات ولا خطوات.
export default function TaskFieldGroup({ title, children }) {
  return (
    <section className="space-y-3 border-t border-border pt-4 first:border-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">{title}</p>
      {children}
    </section>
  );
}