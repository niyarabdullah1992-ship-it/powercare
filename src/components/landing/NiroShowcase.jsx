import React, { useEffect, useState } from "react";
import { Sparkles, Mic, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Animated live demo of Niro, the AI day planner: a prompt "types itself" and
// the schedule builds up in front of the visitor — then loops. All strings come
// from the shared i18n dictionary so every language stays fully localized.
export default function NiroShowcase() {
  const { t } = useI18n();
  const prompt = t("niroDemoPrompt");
  const items = [
    ["09:00", t("niroItem1")],
    ["13:00", t("niroItem2")],
    ["17:00", t("niroItem3")],
    ["21:00", t("niroItem4")],
  ];

  const [typed, setTyped] = useState(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let timer;
    if (typed < prompt.length) {
      timer = setTimeout(() => setTyped(typed + 1), 45);
    } else if (shown < items.length) {
      timer = setTimeout(() => setShown(shown + 1), 550);
    } else {
      timer = setTimeout(() => { setTyped(0); setShown(0); }, 4000);
    }
    return () => clearTimeout(timer);
  }, [typed, shown, prompt.length, items.length]);

  return (
    <div className="px-4 py-14 sm:px-6 md:px-10">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-landing-gold/10 text-landing-gold text-sm font-body font-semibold mb-4">
          <Sparkles className="w-4 h-4" strokeWidth={1.75} /> {t("niroBadge")}
        </p>
        <h2 className="font-heading text-3xl md:text-4xl font-semibold text-[#3a2f22]">
          {t("niroHeading")}
        </h2>
        <p className="text-sm text-[#3a2f22]/55 font-body mt-3 max-w-xl mx-auto">
          {t("niroSub")}
        </p>
      </div>

      <div className="max-w-lg mx-auto rounded-2xl border border-landing-gold/20 bg-white shadow-xl shadow-[#3a2f22]/10 p-5 space-y-4">
        <div className="flex items-start gap-2.5">
          <span className="w-8 h-8 rounded-full bg-landing-bg flex items-center justify-center shrink-0 text-landing-gold">
            <Mic className="w-4 h-4" strokeWidth={1.75} />
          </span>
          <p className="flex-1 rounded-2xl bg-landing-bg px-4 py-3 text-sm font-body text-[#3a2f22] min-h-[46px]" dir="auto">
            {prompt.slice(0, typed)}
            {typed < prompt.length && <span className="inline-block w-0.5 h-4 bg-landing-gold align-middle animate-pulse ms-0.5" />}
          </p>
        </div>
        <div className="space-y-2 min-h-[176px]">
          {items.slice(0, shown).map(([time, title]) => (
            <div key={time} className="flex items-center gap-3 rounded-xl border border-landing-gold/20 bg-landing-bg/60 px-4 py-2.5">
              <span className="text-xs font-semibold text-landing-gold font-body" dir="ltr">{time}</span>
              <span className="flex-1 text-sm font-body text-[#3a2f22]" dir="auto">{title}</span>
              <CheckCircle2 className="w-4 h-4 text-landing-gold/60 shrink-0" strokeWidth={1.75} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}