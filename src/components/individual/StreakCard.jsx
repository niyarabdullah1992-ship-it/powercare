import React from "react";
import { Flame, Trophy } from "lucide-react";
import { computeStreak } from "@/lib/streak";

export default function StreakCard({ data, ar }) {
  const { current, best, activeToday } = computeStreak(data);

  const message = current === 0
    ? (ar ? "ابدأ سلسلتك اليوم — سجّل تقريرًا أو أنجز عنصرًا من جدولك!" : "Start your streak today — write a report or complete a planner item!")
    : activeToday
      ? (ar ? "أحسنت! سلسلتك مستمرة اليوم 🎉" : "Well done! Your streak is alive today 🎉")
      : (ar ? "لا تكسر السلسلة — سجّل نشاطًا اليوم للحفاظ عليها!" : "Don't break the chain — log activity today to keep it!");

  return (
    <div className="p-5 rounded-2xl border border-border bg-card flex items-center gap-4 flex-wrap">
      <div className={`flex items-center justify-center w-14 h-14 rounded-2xl shrink-0 ${current > 0 && activeToday ? "bg-orange-500/15 text-orange-500" : "bg-muted text-muted-foreground"}`}>
        <Flame className="w-8 h-8" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-[160px]">
        <p className="hero-title text-3xl leading-none">
          {current} <span className="text-base font-body text-muted-foreground">{ar ? "يوم متتالي" : current === 1 ? "day streak" : "days streak"}</span>
        </p>
        <p className="text-xs text-muted-foreground font-body mt-1.5">{message}</p>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-body shrink-0">
        <Trophy className="w-3.5 h-3.5" /> {ar ? "أفضل سلسلة:" : "Best:"} {best}
      </div>
    </div>
  );
}