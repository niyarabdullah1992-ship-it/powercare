import React from "react";
import StationInventoryTable from "@/components/inventory/StationInventoryTable";
import TransferHistory from "@/components/inventory/TransferHistory";

export default function CentralInventoryDashboard({ state, ar }) {
  const total = state.purchases.reduce((sum, entry) => sum + Number(entry.totalCost || 0), 0);
  const low = state.items.reduce((sum, item) => sum + (item.locationBalances || []).filter((balance) => Number(balance.quantity || 0) <= Number(item.minimumStock || 0)).length, 0);
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{ar ? "المحطات" : "Stations"}</p><p className="mt-2 text-2xl font-semibold">{state.stations.length}</p></div><div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{ar ? "إجمالي المشتريات" : "Total purchases"}</p><p className="mt-2 text-2xl font-semibold">{total.toLocaleString()} SAR</p></div><div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{ar ? "تنبيهات انخفاض المخزون" : "Low-stock alerts"}</p><p className="mt-2 text-2xl font-semibold">{low}</p></div></div><StationInventoryTable stations={state.stations} items={state.items} purchases={state.purchases} ar={ar} /><TransferHistory movements={state.movements} items={state.requestItems} stations={state.stations} ar={ar} /></div>;
}