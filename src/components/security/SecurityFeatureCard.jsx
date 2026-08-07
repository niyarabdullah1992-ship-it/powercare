import React from "react";

// One security capability card on the public Security & Compliance page.
export default function SecurityFeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-accent/20 bg-card p-6 text-card-foreground shadow-lg shadow-accent/5">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent"><Icon className="h-5 w-5" strokeWidth={1.5} /></span>
      <h3 className="mt-4 font-heading text-xl text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}