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
    <section className="border-y border-border bg-landing-bg px-4 py-0 sm:px-6 md:px-8">
      <div className="mx-auto max-w-[1380px]">
        <p className="border-x border-border py-6 text-center font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">{t("statsHeading")}</p>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.value} className="border border-b-0 border-border px-4 py-8 text-center md:py-10">
              <p className="font-heading text-4xl font-semibold tracking-[-0.04em] text-foreground md:text-5xl">{s.value}</p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-foreground">{t(s.key)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}