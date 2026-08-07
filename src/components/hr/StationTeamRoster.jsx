import React from "react";
import { Link } from "react-router-dom";
import { levelName } from "@/lib/hrLevels";

export default function StationTeamRoster({ team, levels, lang }) {
  const ar = lang === "ar";
  const byId = new Map(levels.map((level) => [level.id, level]));
  return <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-heading text-xl font-semibold">{ar ? "فريق المحطة" : "Station team"}</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{team.length ? team.map((employee) => {
    const title = employee.hrLevelId ? levelName(byId.get(employee.hrLevelId), lang) : employee.role === "station_manager" ? (ar ? "مدير المحطة" : "Station manager") : employee.profile?.position || (ar ? "موظف" : "Employee");
    return <Link key={employee.id} to={`/app/employees/${employee.id}`} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 hover:border-accent/60"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">{employee.name?.charAt(0) || "?"}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{employee.name}</span><span className="block truncate text-xs text-muted-foreground">{title}</span></span></Link>;
  }) : <p className="text-sm text-muted-foreground">{ar ? "لا يوجد موظفون في هذه المحطة" : "No employees at this station"}</p>}</div></section>;
}