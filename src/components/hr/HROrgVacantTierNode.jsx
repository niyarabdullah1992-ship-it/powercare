import React from "react";
import { BriefcaseBusiness } from "lucide-react";
import { levelName } from "@/lib/hrLevels";

export default function HROrgVacantTierNode({ level, lang, ar }) {
  const scope = level.scope === "station" ? (ar ? "محطة" : "Station") : level.scope === "cluster" ? (ar ? "مجموعة" : "Cluster") : (ar ? "شركة" : "Company");
  return <div data-org-node className="mx-auto w-52 rounded-lg border border-dashed border-accent/60 bg-accent/10 p-3 text-center shadow-sm"><BriefcaseBusiness className="mx-auto h-4 w-4 text-accent" /><p className="mt-1 truncate text-xs font-semibold">{levelName(level, lang)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{scope} · {ar ? "منصب شاغر" : "Vacant position"}</p></div>;
}