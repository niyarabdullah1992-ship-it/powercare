import { movementNumber } from "@/lib/movementNumber";

export function buildInventoryDataFile({ movements = [], items = [], stations = [], employees = [], stationId, ar }) {
  const stationName = (id) => stations.find((entry) => (entry.stationId || entry.id) === id)?.name || "—";
  const itemName = (id) => items.find((entry) => entry.id === id)?.name || "—";
  const personName = (id) => employees.find((entry) => entry.employeeId === id || entry.id === id || entry.email === id)?.name || id || "—";
  const selected = movements.filter((entry) => ["issue", "transfer"].includes(entry.movementType) && (!stationId || entry.fromLocationId === stationId || entry.toLocationId === stationId)).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const headers = ar ? ["التاريخ", "رقم الحركة", "نوع الحركة", "الصنف", "الكمية", "من", "إلى / المستلم", "منفذ العملية", "الرصيد قبل", "الرصيد بعد", "الحالة", "مسار البضاعة"] : ["Date", "Movement ID", "Movement type", "Item", "Quantity", "From", "To / Recipient", "Performed by", "Balance before", "Balance after", "Status", "Goods route"];
  const rows = selected.map((entry) => {
    const route = (entry.traceAllocations || []).map((allocation) => (allocation.routeStationIds || []).map(stationName).join(" → ")).filter(Boolean).join(" | ");
    return [new Date(entry.created_date).toLocaleString(ar ? "ar-SA" : "en-GB"), movementNumber(entry), entry.movementType === "issue" ? (ar ? "صرف للعمل" : "Issue to work") : (ar ? "نقل بين المحطات" : "Station transfer"), itemName(entry.itemId), entry.quantity, stationName(entry.fromLocationId), entry.movementType === "issue" ? personName(entry.employeeId) : stationName(entry.toLocationId), personName(entry.performedBy), entry.sourceBalanceBefore ?? entry.balanceBefore ?? "—", entry.sourceBalanceAfter ?? entry.balanceAfter ?? "—", entry.reversedAt ? (ar ? "تم التراجع" : "Reversed") : (ar ? "مكتملة" : "Completed"), route || "—"];
  });
  return { headers, rows, movements: selected };
}