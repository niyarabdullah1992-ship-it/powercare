import React from "react";
import { getOrgRankLabel } from "@/lib/orgTreeRank";
import { orgRankText } from "@/lib/orgRankLocale";

export default function OrgRankPicker({ rank, setRank, ranks, lang }) {
  return <label className="block space-y-1">
    <span className="text-xs font-semibold text-muted-foreground">{orgRankText(lang, "positionGrade")}</span>
    <select value={rank || ""} onChange={(event) => setRank(event.target.value || null)} className="w-full rounded-md border px-3 py-2 text-sm">
      <option value="">{orgRankText(lang, "automatic")}</option>
      {ranks.map((item) => <option key={item.id} value={item.id}>{getOrgRankLabel(item, lang)}</option>)}
    </select>
  </label>;
}