import React from "react";
import { Crown, UsersRound } from "lucide-react";
import { levelName } from "@/lib/hrLevels";

export default function HRAdminTierNode({ group, employees, lang }) {
  const ar = lang === "ar";
  const levels = [group.manager, group.assistant].filter(Boolean);
  const ids = new Set(levels.map((level) => level.id));
  const assigned = employees.filter((employee) => ids.has(employee.hrLevelId));
  return (
    <div className="w-72 rounded-xl border border-accent/35 bg-card p-3 text-center shadow-soft">
      <Crown className="mx-auto h-4 w-4 text-accent" />
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
        {ar ? "مستوى إداري" : "Administrative tier"}
      </p>
      <h3 className="mt-1 font-heading text-base font-semibold">
        {levels.map((level) => levelName(level, lang)).join(" / ")}
      </h3>
      <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        <UsersRound className="h-3 w-3" />
        {assigned.length ? assigned.map((employee) => employee.name).join("، ") : (ar ? "لا يوجد تعيين" : "No assignment")}
      </div>
    </div>
  );
}