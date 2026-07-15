import React from "react";

// One security capability card on the public Security & Compliance page.
export default function SecurityFeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-landing-gold/15 bg-white p-6 shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-landing-bg text-landing-gold">
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </span>
      <h3 className="mt-4 font-heading text-xl text-[#3a2f22]">{title}</h3>
      <p className="mt-2 text-sm font-body leading-relaxed text-[#3a2f22]/60">{text}</p>
    </div>
  );
}