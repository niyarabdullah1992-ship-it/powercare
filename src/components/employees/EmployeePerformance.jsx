import React from "react";
import { useI18n } from "@/lib/i18n";

function performanceColor(ratio) {
  const clamped = Math.max(-50, Math.min(50, ratio));
  const normalized = (clamped + 50) / 100; // 0..1
  const hue = 4 + normalized * 132; // red -> green
  return `hsl(${hue}, 72%, 45%)`;
}

export default function EmployeePerformance({ targets = [] }) {
  const { t } = useI18n();
  const active = targets.filter((tg) => tg.status === "active" || tg.status === "overdue");
  if (active.length === 0) return null;

  const now = Date.now();
  let completed = 0, target = 0, weightedTime = 0;
  for (const tg of active) {
    const weight = tg.task_target || 1;
    completed += tg.completed_tasks || 0;
    target += weight;
    const start = new Date(tg.start_date).getTime();
    const end = new Date(tg.end_date).getTime();
    const dur = end - start;
    const elapsed = now - start;
    const timePct = dur > 0 ? Math.min(100, Math.max(0, (elapsed / dur) * 100)) : 100;
    weightedTime += timePct * weight;
  }
  const progressPct = target > 0 ? Math.round((completed / target) * 100) : 0;
  const timePct = target > 0 ? Math.round(weightedTime / target) : 0;
  const ratio = progressPct - timePct;
  const color = performanceColor(ratio);
  const statusLabel = ratio >= 10 ? t("perfAhead") : ratio <= -10 ? t("perfBehind") : t("perfOnTrack");

  return (
    <div className="mt-2.5 pt-2.5 border-t border-border">
      <div className="flex items-center justify-between text-[10px] font-body text-muted-foreground mb-1">
        <span>{t("taskCompletion")} · {progressPct}%</span>
        <span style={{ color }} className="font-medium">{statusLabel}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progressPct, 100)}%`, background: `linear-gradient(to right, hsl(4,72%,50%), ${color})` }}
        />
      </div>
    </div>
  );
}