import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft } from "lucide-react";

// Guided first steps for new companies — hidden automatically once everything is set up.
export default function OnboardingChecklist({ data, lang, t }) {
  const ar = lang === "ar";
  const steps = [
    {
      done: data.stations.length > 0,
      to: "/app/stations",
      title: t("onboardingStationTitle"),
      desc: t("onboardingStationDesc"),
    },
    {
      done: data.employees.length > 1,
      to: "/app/employees",
      title: t("onboardingEmployeeTitle"),
      desc: t("onboardingEmployeeDesc"),
    },
    {
      done: data.stations.some((s) => s.lat && s.lng),
      to: "/app/attendance",
      title: t("onboardingLocationTitle"),
      desc: t("onboardingLocationDesc"),
    },
  ];

  if (steps.every((s) => s.done)) return null;
  const doneCount = steps.filter((s) => s.done).length;
  const nextIndex = steps.findIndex((s) => !s.done);
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <div className="rounded-2xl border border-accent/30 bg-card overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-heading text-xl font-semibold">
            {t("onboardingWelcome")}
          </h3>
          <span className="text-xs font-body text-muted-foreground">{doneCount}/{steps.length}</span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
      </div>
      <div className="divide-y divide-border">
        {steps.map((s, i) => (
          <Link
            key={i}
            to={s.to}
            aria-current={i === nextIndex ? "step" : undefined}
            className={`flex items-center gap-4 px-6 py-4 transition-colors ${s.done ? "opacity-60 hover:bg-muted/50" : i === nextIndex ? "bg-accent/10 hover:bg-accent/15" : "hover:bg-muted/50"}`}
          >
            {s.done ? (
              <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-body font-semibold ${s.done ? "line-through" : ""}`}>{s.title}</p>
              <p className="text-xs text-muted-foreground font-body">{s.desc}</p>
            </div>
            {!s.done && (
              <span className="flex items-center gap-2 text-accent shrink-0">
                <span className="text-[10px] font-semibold">{i + 1}</span>
                <Arrow className="w-4 h-4" />
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}