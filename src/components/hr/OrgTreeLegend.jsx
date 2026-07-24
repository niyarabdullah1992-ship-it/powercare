import React from "react";
import { Building2, Crown } from "lucide-react";
import { getOrgRankLabel, getOrgRanks } from "@/lib/orgTreeRank";
import { getOrgRankVisual } from "@/lib/orgRankVisuals";
import { orgRankText } from "@/lib/orgRankLocale";

export default function OrgTreeLegend({ ranks, lang }) {
  return <aside className="absolute bottom-3 left-3 z-20 flex max-w-[80%] flex-wrap gap-1.5 rounded-lg border border-border bg-card/95 p-2 shadow-elevated backdrop-blur-sm" aria-label={orgRankText(lang, "legend")}>
    <span className="flex items-center gap-1 rounded-full border border-primary bg-accent px-2 py-1 text-[9px] font-semibold text-accent-foreground"><Building2 className="h-3 w-3" />{orgRankText(lang, "station")}</span>
    <span className="flex items-center gap-1 rounded-full border border-primary bg-accent px-2 py-1 text-[9px] font-semibold text-accent-foreground"><Crown className="h-3 w-3" />{orgRankText(lang, "owner")}</span>
    {getOrgRanks(ranks).map((rank) => {
      const { Icon, card } = getOrgRankVisual(rank);
      return <span key={rank.id} className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold ${card}`}><Icon className="h-3 w-3" />{getOrgRankLabel(rank, lang)}</span>;
    })}
  </aside>;
}