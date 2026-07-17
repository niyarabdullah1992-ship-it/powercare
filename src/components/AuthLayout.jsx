import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sign-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-sign-gold/25 bg-sign-surface shadow-soft mb-5">
            <Icon className="w-7 h-7 text-sign-gold" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-sign-ink">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="rounded-3xl border border-sign-gold/20 bg-sign-surface p-7 shadow-elevated sm:p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}