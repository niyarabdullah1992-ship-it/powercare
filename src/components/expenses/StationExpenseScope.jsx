import React from "react";

export default function StationExpenseScope({ stations, scope, setScope, selected, setSelected, canPick, ar }) {
  if (!canPick) return <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{ar ? "يُسجل المصروف على محطتك." : "Expense applies to your station."}</p>;
  const toggle = (id) => setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  return <div className="space-y-2 rounded-xl border border-border p-3 md:col-span-2 xl:col-span-5">
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setScope("all")} className={`rounded-full px-3 py-1.5 text-sm ${scope === "all" ? "bg-accent text-accent-foreground" : "bg-secondary"}`}>{ar ? "جميع المحطات" : "All stations"}</button>
      <button type="button" onClick={() => setScope("selected")} className={`rounded-full px-3 py-1.5 text-sm ${scope === "selected" ? "bg-accent text-accent-foreground" : "bg-secondary"}`}>{ar ? "محطات معينة" : "Selected stations"}</button>
    </div>
    {scope === "selected" && <div className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">{stations.map((station) => <label key={station.stationId} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-secondary/60"><input type="checkbox" checked={selected.includes(station.stationId)} onChange={() => toggle(station.stationId)} className="h-4 w-4 shrink-0" /><span className="flex-1">{station.name}</span></label>)}</div>}
  </div>;
}