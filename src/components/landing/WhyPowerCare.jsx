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
    <div className="max-w-6xl mx-auto mb-14">
      <h2 className="hero-title text-center text-4xl md:text-5xl text-primary mb-8">
        {ar ? "لماذا PowerCare؟" : "Why PowerCare?"}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-landing-olive-card rounded-2xl p-5 text-center shadow-sm">
            <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-landing-bg text-landing-gold">
              <s.icon className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <p className="hero-title text-3xl text-[#3a2f22]" dir="ltr">{s.value}</p>
            <p className="mt-1 text-xs font-body text-[#3a2f22]/70">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}