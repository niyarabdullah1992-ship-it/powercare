const stationIdOf = (station) => station.stationId || station.id;

const periodStart = (period) => {
  const date = new Date();
  if (period === "year") date.setFullYear(date.getFullYear() - 1);
  else if (period === "2years") date.setFullYear(date.getFullYear() - 2);
  else date.setMonth(date.getMonth() - ({ month: 1, "3months": 3, "6months": 6 }[period] || 1));
  return date;
};

export function buildInventoryPeriodReport({ items = [], purchases = [], movements = [], stations = [], stationId = "all", period = "month", from = null, to = null, ar = false }) {
  // Explicit range (unified period system) wins; the legacy period id stays as fallback.
  const rangeStart = from ? new Date(from) : periodStart(period);
  const rangeEnd = to ? new Date(to) : null;
  const stationName = (id) => stations.find((station) => stationIdOf(station) === id)?.name || "—";
  const itemName = (id) => items.find((item) => item.id === id)?.name || "—";
  const inStation = (id) => stationId === "all" || id === stationId;
  const inPeriod = (entry, field) => {
    const when = new Date(entry[field] || entry.created_date);
    return when >= rangeStart && (!rangeEnd || when <= rangeEnd);
  };
  const balances = items.flatMap((item) => {
    const rows = item.locationBalances?.length ? item.locationBalances : [{ locationId: item.currentLocationId, quantity: item.quantity }];
    return rows.filter((balance) => inStation(balance.locationId)).map((balance) => ({ ...item, locationId: balance.locationId, balance: Number(balance.quantity) || 0 }));
  });
  const purchaseRows = purchases.filter((entry) => inStation(entry.toLocationId) && inPeriod(entry, "purchaseDate"));
  const movementRows = movements.filter((entry) => (stationId === "all" || entry.fromLocationId === stationId || entry.toLocationId === stationId) && inPeriod(entry, "created_date"));
  const movementType = (value) => ({ purchase: ar ? "شراء" : "Purchase", receive: ar ? "استلام" : "Receive", issue: ar ? "صرف" : "Issue", return: ar ? "إرجاع" : "Return", transfer: ar ? "نقل" : "Transfer", reversal: ar ? "تراجع" : "Reversal" }[value] || value);
  const date = (value) => new Date(value).toLocaleDateString(ar ? "ar-SA" : "en-GB");
  const sections = [
    { heading: ar ? "الأصناف والأرصدة الحالية" : "Items and current balances", headers: ar ? ["الكود", "الصنف", "المحطة", "الرصيد", "الحد الأدنى", "الحالة"] : ["Code", "Item", "Station", "Balance", "Minimum", "Status"], rows: balances.map((item) => [item.itemCode, item.name, stationName(item.locationId), item.balance, Number(item.minimumStock) || 0, item.balance <= Number(item.minimumStock || 0) ? (ar ? "منخفض" : "Low") : (ar ? "متوفر" : "Available")]) },
    { heading: ar ? "المشتريات والفواتير" : "Purchases and invoices", headers: ar ? ["التاريخ", "الصنف", "المورد", "المحطة", "الكمية", "القيمة", "الفاتورة"] : ["Date", "Item", "Supplier", "Station", "Quantity", "Value", "Invoice"], rows: purchaseRows.map((entry) => [date(entry.purchaseDate || entry.created_date), itemName(entry.itemId), entry.supplierName || "—", stationName(entry.toLocationId), entry.quantity, Number(entry.totalCost || 0).toLocaleString(), entry.invoiceName || (entry.invoiceUrl ? (ar ? "مرفقة" : "Attached") : "—")]) },
    { heading: ar ? "حركات المخزون" : "Inventory movements", headers: ar ? ["التاريخ", "الصنف", "الحركة", "الكمية", "من", "إلى", "منفذ العملية"] : ["Date", "Item", "Movement", "Quantity", "From", "To", "Performed by"], rows: movementRows.map((entry) => [date(entry.created_date), itemName(entry.itemId), movementType(entry.movementType), entry.quantity, stationName(entry.fromLocationId), stationName(entry.toLocationId), entry.performedBy || "—"]) },
  ];
  const excelHeaders = ar ? ["القسم", "التاريخ", "الكود / الصنف", "المحطة / من", "إلى / المورد", "الكمية", "القيمة / الحد الأدنى", "الحالة / الحركة / الفاتورة"] : ["Section", "Date", "Code / item", "Station / from", "To / supplier", "Quantity", "Value / minimum", "Status / movement / invoice"];
  const excelRows = [
    ...balances.map((item) => [ar ? "الأرصدة" : "Balances", "—", `${item.itemCode} — ${item.name}`, stationName(item.locationId), "—", item.balance, Number(item.minimumStock) || 0, item.balance <= Number(item.minimumStock || 0) ? (ar ? "منخفض" : "Low") : (ar ? "متوفر" : "Available")]),
    ...purchaseRows.map((entry) => [ar ? "المشتريات" : "Purchases", date(entry.purchaseDate || entry.created_date), itemName(entry.itemId), stationName(entry.toLocationId), entry.supplierName || "—", entry.quantity, Number(entry.totalCost || 0), entry.invoiceName || "—"]),
    ...movementRows.map((entry) => [ar ? "الحركات" : "Movements", date(entry.created_date), itemName(entry.itemId), stationName(entry.fromLocationId), stationName(entry.toLocationId), entry.quantity, "—", movementType(entry.movementType)]),
  ];
  return { sections, excelHeaders, excelRows, stats: [{ value: balances.length, label: ar ? "الأرصدة" : "Balances" }, { value: purchaseRows.length, label: ar ? "المشتريات" : "Purchases" }, { value: movementRows.length, label: ar ? "الحركات" : "Movements" }] };
}