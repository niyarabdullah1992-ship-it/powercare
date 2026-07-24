import React from "react";

export default function OrgRankPicker({ rank, setRank, ranks, ar }) {
  return <label className="block space-y-1">
    <span className="text-xs font-semibold text-muted-foreground">{ar ? "درجة المنصب" : "Position grade"}</span>
    <select value={rank || ""} onChange={(event) => setRank(event.target.value || null)} className="w-full rounded-md border px-3 py-2 text-sm">
      <option value="">{ar ? "تلقائي حسب مستوى الشجرة" : "Automatic by tree level"}</option>
      {ranks.map((item) => <option key={item.id} value={item.id}>{ar ? item.labelAr : item.labelEn}</option>)}
    </select>
  </label>;
}