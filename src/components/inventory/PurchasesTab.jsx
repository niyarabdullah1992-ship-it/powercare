import React, { useMemo, useState } from "react";
import PurchaseChart from "@/components/inventory/PurchaseChart";

export default function PurchasesTab({ purchases, items, stations, activeStation, canViewAll, ar }) {
  const [period, setPeriod] = useState("month");
  const [stationId, setStationId] = useState(canViewAll ? "all" : activeStation);
  const selectedStation = stationId || activeStation;
  const rows = purchases.filter((entry) => selectedStation === "all" || entry.toLocationId === selectedStation);
  const chart = useMemo(() => Object.values(rows.reduce((acc, entry) => {
    const date = new Date(entry.purchaseDate || entry.created_date); const key = period === "month" ? date.toISOString().slice(0, 7) : `${date.getFullYear()}-W${Math.ceil((((date - new Date(date.getFullYear(), 0, 1)) / 86400000) + new Date(date.getFullYear(), 0, 1).getDay() + 1) / 7)}`;
    acc[key] ||= { label: key, total: 0 }; acc[key].total += Number(entry.totalCost || 0); return acc;
  }, {})).sort((a, b) => a.label.localeCompare(b.label)), [rows, period]);
  const total = rows.reduce((sum, entry) => sum + Number(entry.totalCost || 0), 0);
  const itemName = (id) => items.find((item) => item.id === id)?.name || "—";
  const stationName = (id) => stations.find((station) => station.stationId === id)?.name || "—";
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2">{canViewAll && <select value={stationId} onChange={(e) => setStationId(e.target.value)} className="rounded-lg border px-3 py-2"><option value="all">{ar ? "كل المحطات" : "All stations"}</option>{stations.map((s) => <option key={s.stationId} value={s.stationId}>{s.name}</option>)}</select>}<select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border px-3 py-2"><option value="month">{ar ? "شهري" : "Monthly"}</option><option value="week">{ar ? "أسبوعي" : "Weekly"}</option></select></div>
    <div className="rounded-xl border border-accent/25 bg-card p-4"><p className="text-xs text-muted-foreground">{ar ? "إجمالي قيمة المشتريات" : "Total purchase value"}</p><p className="mt-1 text-3xl font-semibold text-accent">{total.toLocaleString()} <span className="text-sm">SAR</span></p></div>
    <PurchaseChart data={chart} ar={ar} />
    <div className="space-y-2">{rows.map((entry) => <div key={entry.id} className="grid gap-2 rounded-xl border bg-card p-4 text-sm md:grid-cols-5"><strong>{itemName(entry.itemId)}</strong><span>{entry.supplierName || "—"}</span><span>{entry.quantity}</span><span>{Number(entry.totalCost || 0).toLocaleString()} SAR</span><span className="text-muted-foreground">{stationName(entry.toLocationId)} · {new Date(entry.purchaseDate || entry.created_date).toLocaleString(ar ? "ar-SA" : "en-GB")}</span></div>)}{!rows.length && <p className="py-8 text-center text-muted-foreground">{ar ? "لا توجد مشتريات." : "No purchases."}</p>}</div>
  </div>;
}