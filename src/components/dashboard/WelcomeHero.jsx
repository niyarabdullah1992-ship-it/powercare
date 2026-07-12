import React from "react";
import { formatDate } from "@/lib/dateFormat";
import Logo from "@/components/Logo";

// Calm, artistic welcome banner shown right after login — greets the user and
// surfaces the day's most important alerts without feeling noisy.
export default function WelcomeHero({ name, companyName, t, lang, alerts = [] }) {
  const hasAlerts = alerts.some((a) => a.value > 0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-landing-gold/20 bg-gradient-to-br from-[#2a2013] via-[#3a2e1f] to-[#1c150c] p-6 md:p-8">
      <div className="absolute -top-20 -end-16 w-64 h-64 rounded-full bg-landing-gold/20 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-24 -start-10 w-56 h-56 rounded-full bg-landing-gold-deep/20 blur-[80px] pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="shrink-0 bg-white/5 border border-landing-gold/30 rounded-full p-2.5">
            <Logo size={34} />
          </div>
          <div>
            <p className="text-[11px] tracking-widest-xl uppercase text-landing-gold-light/70 font-body mb-1">
              {formatDate(new Date(), lang, { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h2 className="hero-title text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-b from-landing-gold-light to-landing-gold">
              {t("welcome")}, {name}
            </h2>
            <p className="text-white/40 font-body text-sm mt-1">{companyName}</p>
          </div>
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap gap-3">
        {hasAlerts ? (
          alerts.filter((a) => a.value > 0).map((a) => (
            <div
              key={a.key}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <span className="w-8 h-8 rounded-full bg-landing-gold/15 text-landing-gold-light flex items-center justify-center shrink-0">
                <a.icon className="w-4 h-4" strokeWidth={1.75} />
              </span>
              <div>
                <p className="hero-title text-xl text-white leading-none">{a.value}</p>
                <p className="text-[10px] tracking-widest-xl uppercase text-white/40 font-body mt-1">{a.label}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-white/50 font-body text-sm">{t("noNotifications")}</p>
        )}
      </div>
    </div>
  );
}