import React from "react";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";

export default function MovementExportButtons({ movements, items, stations, employees = [], ar }) {
  const item = (id) => items.find((entry) => entry.id === id)?.name || "—";
  const station = (id) => stations.find((entry) => entry.stationId === id)?.name || "—";
  const person = (value) => employees.find((entry) => entry.employeeId === value || entry.id === value || entry.email === value)?.name || (value && !/^\d+$/.test(String(value)) ? value : "—");
  const type = (value) => ({ purchase: ar ? "شراء" : "Purchase", receive: ar ? "استلام" : "Receive", issue: ar ? "صرف للعمل" : "Issue to work", return: ar ? "إرجاع" : "Return", transfer: ar ? "نقل بين المحطات" : "Station transfer" }[value] || value);
  const status = (value) => ({ purchase: ar ? "تم تسجيل الشراء" : "Purchase recorded", receive: ar ? "تم الاستلام" : "Received", issue: ar ? "تم التسليم للعمل" : "Issued to work", return: ar ? "تم الإرجاع" : "Returned", transfer: ar ? "مكتمل: خُصم من المصدر وأُضيف للوجهة" : "Completed: deducted from source and added to destination" }[value] || "—");
  const headers = ar ? ["التاريخ", "الصنف", "الحركة", "الحالة", "الكمية", "من", "إلى", "الموظف المسؤول", "منفذ العملية", "قبل", "بعد", "قبل الوجهة", "بعد الوجهة"] : ["Date", "Item", "Type", "Status", "Qty", "From", "To", "Responsible employee", "Performed by", "Before", "After", "Destination before", "Destination after"];
  const rows = movements.map((entry) => [new Date(entry.created_date).toLocaleString(ar ? "ar-SA" : "en"), item(entry.itemId), type(entry.movementType), status(entry.movementType), entry.quantity, station(entry.fromLocationId), station(entry.toLocationId), person(entry.employeeId), person(entry.performedBy), entry.sourceBalanceBefore ?? entry.balanceBefore ?? "—", entry.sourceBalanceAfter ?? entry.balanceAfter ?? "—", entry.destinationBalanceBefore ?? "—", entry.destinationBalanceAfter ?? "—"]);
  return <ComparisonExportButtons title={ar ? "سجل حركة المخزون" : "Inventory Movement Log"} headers={headers} rows={rows} />;
}