import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="powercare-public flex min-h-screen items-center justify-center bg-landing-cinema px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/35 bg-accent/10 shadow-lg shadow-accent/10"><Icon className="h-7 w-7 text-accent" aria-hidden="true" /></div>
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-white/55">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-accent/25 bg-card p-7 shadow-2xl shadow-accent/10 sm:p-8">{children}</div>
        {footer && <p className="mt-6 text-center text-sm text-white/55">{footer}</p>}
      </div>
    </div>
  );
}