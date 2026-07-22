import React from "react";
import { useI18n } from "@/lib/i18n";

const STATS = [
  { value: "10K+", key: "stat1" },
  { value: "50K+", key: "stat2" },
  { value: "5K+", key: "stat3" },
  { value: "99.9%", key: "stat4" },
];

export default function StatsBand() {
  const { t } = useI18n();
  return (
    <section className="border-y border-accent/20 bg-landing-cinema px-6 py-14 md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="mb-9 text-center text-xs font-semibold uppercase tracking-widest-xl text-accent">{t("statsHeading")}</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.value} className="text-center">
              <p className="font-heading text-4xl font-semibold text-white md:text-5xl">{s.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{t(s.key)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}