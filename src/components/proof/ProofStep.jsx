import React from "react";

// خطوة مرقّمة داخل قسم إثبات العمل — ترتيب واضح من اختيار المحطة إلى الأرشيف.
export default function ProofStep({ number, title, hint, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-xs font-semibold text-accent">{number}</span>
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2>
          {hint && <p className="text-xs text-muted-foreground font-body">{hint}</p>}
        </div>
      </div>
      <div className="space-y-4 ps-10">{children}</div>
    </section>
  );
}