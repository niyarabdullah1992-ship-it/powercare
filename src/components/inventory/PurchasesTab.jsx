import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import PurchaseChart from "@/components/inventory/PurchaseChart";
import PurchaseFilters from "@/components/inventory/PurchaseFilters";
import ImageGallery from "@/components/inventory/ImageGallery";
import { useI18n } from "@/lib/i18n";

export default function PurchasesTab({ purchases, items, stations, activeStation, canViewAll, ar }) {
  const { t } = useI18n();
  const [period, setPeriod] = useState("month");
  const [stationId, setStationId] = useState(canViewAll ? "all" : activeStation);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [openId, setOpenId] = useState(null);
  const selectedStation = stationId || activeStation;
  const rows = useMemo(() => {
    const now = new Date();
    let from = null; let to = null;
    if (period === "custom") {
      if (startDate) from = new Date(`${startDate}T00:00:00`);
      if (endDate) to = new Date(`${endDate}T23:59:59.999`);
    } else {
      from = new Date(now);
      if (period === "year") from.setFullYear(from.getFullYear() - 1);
      else from.setMonth(from.getMonth() - ({ month: 1, "3months": 3, "6months": 6 }[period] || 1));
    }
    return purchases.filter((entry) => {
      const date = new Date(entry.purchaseDate || entry.created_date);
      return (selectedStation === "all" || entry.toLocationId === selectedStation) && (!from || date >= from) && (!to || date <= to);
    }).sort((a, b) => new Date(b.purchaseDate || b.created_date) - new Date(a.purchaseDate || a.created_date));
  }, [purchases, selectedStation, period, startDate, endDate]);
  const chart = useMemo(() => {
    const customDays = startDate && endDate ? (new Date(endDate) - new Date(startDate)) / 86400000 : Infinity;
    const daily = period === "month" || (period === "custom" && customDays <= 62);
    return Object.values(rows.reduce((acc, entry) => {
      const date = new Date(entry.purchaseDate || entry.created_date); const key = date.toISOString().slice(0, daily ? 10 : 7);
      acc[key] ||= { label: key, total: 0 }; acc[key].total += Number(entry.totalCost || 0); return acc;
    }, {})).sort((a, b) => a.label.localeCompare(b.label));
  }, [rows, period, startDate, endDate]);
  const total = rows.reduce((sum, entry) => sum + Number(entry.totalCost || 0), 0);
  const itemName = (id) => items.find((item) => item.id === id)?.name || "—";
  const stationName = (id) => stations.find((station) => station.stationId === id)?.name || "—";
  return <div className="space-y-4">
    <PurchaseFilters canViewAll={canViewAll} stations={stations} stationId={stationId} onStation={setStationId} period={period} onPeriod={setPeriod} startDate={startDate} endDate={endDate} onStartDate={setStartDate} onEndDate={setEndDate} />
    <div className="rounded-xl border border-accent/25 bg-card p-4"><p className="text-xs text-muted-foreground">{ar ? "إجمالي قيمة المشتريات" : "Total purchase value"}</p><p className="mt-1 text-3xl font-semibold text-accent">{total.toLocaleString()} <span className="text-sm">SAR</span></p></div>
    <PurchaseChart data={chart} ar={ar} />
    <div className="space-y-2">{rows.map((entry) => <div key={entry.id} className="rounded-xl border bg-card p-4 text-sm"><button type="button" onClick={() => setOpenId(openId === entry.id ? null : entry.id)} className="grid w-full gap-2 text-start md:grid-cols-[1fr_1fr_.5fr_1fr_1.5fr_auto]"><strong>{itemName(entry.itemId)}</strong><span>{entry.supplierName || "—"}</span><span>{entry.quantity}</span><span>{Number(entry.totalCost || 0).toLocaleString()} SAR</span><span className="text-muted-foreground">{stationName(entry.toLocationId)} · {new Date(entry.purchaseDate || entry.created_date).toLocaleString(ar ? "ar-SA" : "en-GB")}</span><ChevronDown className={`h-4 w-4 ${openId === entry.id ? "rotate-180" : ""}`} /></button>{openId === entry.id && <div className="mt-4 border-t pt-4">{entry.imageUrls?.length ? <><p className="mb-2 font-medium">{t("invoiceGoodsImages")}</p><ImageGallery images={entry.imageUrls} ar={ar} /></> : <p className="text-muted-foreground">{t("noPurchaseImages")}</p>}</div>}</div>)}{!rows.length && <p className="py-8 text-center text-muted-foreground">{ar ? "لا توجد مشتريات." : "No purchases."}</p>}</div>
  </div>;
}