import React from "react";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";

export default function MovementExportButtons({ movements, items, stations, ar }) {
  const item = (id) => items.find((entry) => entry.id === id)?.name || "—";
  const station = (id) => stations.find((entry) => entry.stationId === id)?.name || "—";
  const headers = ar ? ["التاريخ", "الصنف", "الحركة", "الكمية", "من", "إلى", "المنفذ", "قبل", "بعد", "قبل الوجهة", "بعد الوجهة"] : ["Date", "Item", "Type", "Qty", "From", "To", "Performed by", "Before", "After", "Destination before", "Destination after"];
  const rows = movements.map((entry) => [new Date(entry.created_date).toLocaleString(ar ? "ar-SA" : "en"), item(entry.itemId), entry.movementType, entry.quantity, station(entry.fromLocationId), station(entry.toLocationId), entry.performedBy, entry.balanceBefore ?? "—", entry.balanceAfter ?? "—", entry.destinationBalanceBefore ?? "—", entry.destinationBalanceAfter ?? "—"]);
  return <ComparisonExportButtons title={ar ? "سجل حركة المخزون" : "Inventory Movement Log"} headers={headers} rows={rows} />;
}