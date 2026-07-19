import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import PurchaseChart from "@/components/inventory/PurchaseChart";
import ImageGallery from "@/components/inventory/ImageGallery";

export default function PurchasesTab({ purchases, items, stations, activeStation, canViewAll, ar }) {
  const [period, setPeriod] = useState("month");
  const [stationId, setStationId] = useState(canViewAll ? "all" : activeStation);
  const [openId, setOpenId] = useState(null);
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
    <div className="space-y-2">{rows.map((entry) => <div key={entry.id} className="rounded-xl border bg-card p-4 text-sm"><button type="button" onClick={() => setOpenId(openId === entry.id ? null : entry.id)} className="grid w-full gap-2 text-start md:grid-cols-[1fr_1fr_.5fr_1fr_1.5fr_auto]"><strong>{itemName(entry.itemId)}</strong><span>{entry.supplierName || "—"}</span><span>{entry.quantity}</span><span>{Number(entry.totalCost || 0).toLocaleString()} SAR</span><span className="text-muted-foreground">{stationName(entry.toLocationId)} · {new Date(entry.purchaseDate || entry.created_date).toLocaleString(ar ? "ar-SA" : "en-GB")}</span><ChevronDown className={`h-4 w-4 ${openId === entry.id ? "rotate-180" : ""}`} /></button>{openId === entry.id && <div className="mt-4 border-t pt-4">{entry.imageUrls?.length ? <><p className="mb-2 font-medium">{ar ? "صور الفاتورة أو البضاعة" : "Invoice or goods images"}</p><ImageGallery images={entry.imageUrls} ar={ar} /></> : <p className="text-muted-foreground">{ar ? "لا توجد صور لهذه العملية." : "No images for this purchase."}</p>}</div>}</div>)}{!rows.length && <p className="py-8 text-center text-muted-foreground">{ar ? "لا توجد مشتريات." : "No purchases."}</p>}</div>
  </div>;
}