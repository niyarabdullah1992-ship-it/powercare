import React, { useMemo } from "react";

export default function StationInventoryTable({ stations, items, purchases, ar }) {
  const rows = useMemo(() => {
    const now = new Date();
    const latestPrice = {};
    purchases.forEach((entry) => { if (latestPrice[entry.itemId] == null) latestPrice[entry.itemId] = Number(entry.unitPrice || entry.purchasePrice || 0); });
    return stations.map((station) => {
      const stationId = station.stationId;
      const balances = items.filter((item) => item.locationBalances?.some((balance) => balance.locationId === stationId)).map((item) => ({ item, quantity: Number(item.locationBalances.find((balance) => balance.locationId === stationId)?.quantity || 0) }));
      const monthly = purchases.filter((entry) => { const date = new Date(entry.purchaseDate || entry.created_date); return entry.toLocationId === stationId && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }).reduce((sum, entry) => sum + Number(entry.totalCost || 0), 0);
      return { id: stationId, name: station.name, count: balances.length, value: balances.reduce((sum, entry) => sum + entry.quantity * Number(latestPrice[entry.item.id] || 0), 0), monthly, low: balances.filter(({ item, quantity }) => quantity <= Number(item.minimumStock || 0)).length };
    });
  }, [stations, items, purchases]);
  const labels = ar ? ["المحطة", "عدد الأصناف", "قيمة المخزون", "مشتريات الشهر", "التنبيهات"] : ["Station", "Items", "Inventory value", "Monthly purchases", "Alerts"];
  return <div className="overflow-hidden rounded-xl border border-border bg-card"><table className="mobile-cards w-full text-sm"><thead className="bg-muted/60 text-muted-foreground"><tr>{labels.map((label) => <th key={label} className="px-4 py-3 text-start font-medium">{label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-border"><td data-label={labels[0]} className="px-4 py-3 font-medium">{row.name}</td><td data-label={labels[1]} className="px-4 py-3">{row.count}</td><td data-label={labels[2]} className="px-4 py-3">{row.value.toLocaleString()} SAR</td><td data-label={labels[3]} className="px-4 py-3">{row.monthly.toLocaleString()} SAR</td><td data-label={labels[4]} className="px-4 py-3">{row.low ? <span className="text-amber-700">{row.low}</span> : "—"}</td></tr>)}</tbody></table></div>;
}