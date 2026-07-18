import React from "react";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";

export default function InventoryExportButtons({ items, stations, ar }) {
  const stationName = (id) => stations.find((station) => station.stationId === id)?.name || "—";
  const headers = ar
    ? ["كود الصنف", "اسم الصنف", "طريقة التتبع", "المحطة", "الكمية", "الحد الأدنى", "الحالة"]
    : ["Item code", "Item name", "Tracking", "Station", "Quantity", "Minimum", "Status"];
  const rows = items.map((item) => [
    item.itemCode,
    item.name,
    item.trackingMode === "serialized" ? (ar ? "تسلسلي" : "Serialized") : (ar ? "كميات" : "Quantity"),
    stationName(item.currentLocationId),
    Number(item.quantity || 0),
    Number(item.minimumStock || 0),
    Number(item.quantity || 0) <= Number(item.minimumStock || 0) ? (ar ? "مخزون منخفض" : "Low stock") : (ar ? "متوفر" : "Available"),
  ]);
  return <ComparisonExportButtons title={ar ? "تقرير المخزون الصناعي" : "Industrial Inventory Report"} headers={headers} rows={rows} />;
}