import React from "react";
import { Building2, Users, Globe2, ShieldCheck } from "lucide-react";

// "Why PowerCare?" — achievement numbers + trust icons, shown right above the benefits.
export default function WhyPowerCare({ lang }) {
  const ar = lang === "ar";
  const stats = [
    { icon: Building2, value: "+120", label: ar ? "شركة مشتركة" : "Companies onboard" },
    { icon: Users, value: "+8,500", label: ar ? "موظف نشط" : "Active employees" },
    { icon: Globe2, value: "6", label: ar ? "دول حول العالم" : "Countries worldwide" },
    { icon: ShieldCheck, value: "99.9%", label: ar ? "موثوقية التشغيل" : "Uptime reliability" },
  ];
  return (
    <div className="mx-auto mb-7 max-w-[1380px]">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="rounded-xl border border-landing-gold/25 bg-primary p-5 text-center text-primary-foreground shadow-soft">
            <span className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-landing-gold/15 text-landing-gold-light"><s.icon className="h-4 w-4" strokeWidth={1.5} /></span>
            <p className="font-heading text-3xl font-semibold" dir="ltr">{s.value}</p>
            <p className="mt-1 text-xs opacity-80">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}