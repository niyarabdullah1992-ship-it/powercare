const value = (number) => Number(number || 0);

export function buildStationInventoryReport({ stationId, stations, items, historyItems, movements, requests, employees, ar }) {
  const allStations = stationId === "all";
  const stationName = allStations ? (ar ? "جميع المحطات" : "All stations") : stations.find((entry) => (entry.stationId || entry.id) === stationId)?.name || "—";
  const itemName = (id) => historyItems.find((entry) => entry.id === id)?.name || items.find((entry) => entry.id === id)?.name || "—";
  const locationName = (id) => stations.find((entry) => (entry.stationId || entry.id) === id)?.name || "—";
  const personName = (id) => employees.find((entry) => entry.employeeId === id || entry.id === id)?.name || id || "—";
  const date = (input) => input ? new Date(input).toLocaleString(ar ? "ar-SA" : "en-GB") : "—";
  const type = (name) => ({ purchase: ar ? "شراء" : "Purchase", receive: ar ? "استلام" : "Receive", issue: ar ? "صرف للعمل" : "Issue to work", return: ar ? "إرجاع" : "Return", transfer: ar ? "نقل" : "Transfer", reversal: ar ? "تراجع" : "Reversal" }[name] || name);
  const requestStatus = (name) => ({ pending: ar ? "قيد الانتظار" : "Pending", approved: ar ? "معتمد" : "Approved", rejected: ar ? "مرفوض" : "Rejected", issued: ar ? "تم الصرف" : "Issued" }[name] || name);

  const stock = items.flatMap((item) => (item.locationBalances || [])
    .filter((entry) => allStations || entry.locationId === stationId)
    .map((entry) => ({ ...item, reportStationId: entry.locationId, stationQuantity: value(entry.quantity) })));
  const stationMovements = allStations ? movements : movements.filter((entry) => entry.fromLocationId === stationId || entry.toLocationId === stationId);
  const purchases = stationMovements.filter((entry) => entry.movementType === "purchase" && (allStations || entry.toLocationId === stationId));
  const stationRequests = allStations ? requests : requests.filter((entry) => entry.stationId === stationId || entry.sourceStationId === stationId);
  const totalQuantity = stock.reduce((sum, item) => sum + item.stationQuantity, 0);
  const purchaseValue = purchases.reduce((sum, entry) => sum + value(entry.totalCost), 0);
  const lowStock = stock.filter((item) => item.stationQuantity <= value(item.minimumStock)).length;

  const stockRows = stock.map((item) => [item.itemCode, item.name, ...(allStations ? [locationName(item.reportStationId)] : []), item.stationQuantity, value(item.minimumStock), item.stationQuantity <= value(item.minimumStock) ? (ar ? "منخفض" : "Low") : (ar ? "متوفر" : "Available")]);
  const purchaseRows = purchases.map((entry) => [date(entry.purchaseDate || entry.created_date), itemName(entry.itemId), value(entry.quantity), entry.supplierName || "—", value(entry.unitPrice ?? entry.purchasePrice), value(entry.totalCost)]);
  const movementRows = stationMovements.map((entry) => [date(entry.created_date), itemName(entry.itemId), type(entry.movementType), value(entry.quantity), locationName(entry.fromLocationId), locationName(entry.toLocationId), personName(entry.performedBy)]);
  const requestRows = stationRequests.map((entry) => [date(entry.created_date), itemName(entry.itemId), value(entry.quantity), locationName(entry.sourceStationId), locationName(entry.stationId), requestStatus(entry.status), value(entry.totalCost)]);

  const sections = [
    { heading: ar ? "المخزون الحالي" : "Current stock", headers: allStations ? (ar ? ["الكود", "الصنف", "المحطة", "الكمية", "الحد الأدنى", "الحالة"] : ["Code", "Item", "Station", "Quantity", "Minimum", "Status"]) : (ar ? ["الكود", "الصنف", "الكمية", "الحد الأدنى", "الحالة"] : ["Code", "Item", "Quantity", "Minimum", "Status"]), rows: stockRows },
    { heading: ar ? "المشتريات" : "Purchases", headers: ar ? ["التاريخ", "الصنف", "الكمية", "المورد", "سعر الوحدة", "الإجمالي"] : ["Date", "Item", "Quantity", "Supplier", "Unit price", "Total"], rows: purchaseRows },
    { heading: ar ? "الحركات" : "Movements", headers: ar ? ["التاريخ", "الصنف", "النوع", "الكمية", "من", "إلى", "المنفذ"] : ["Date", "Item", "Type", "Quantity", "From", "To", "Performed by"], rows: movementRows },
    { heading: ar ? "طلبات المواد" : "Material requests", headers: ar ? ["التاريخ", "الصنف", "الكمية", "المصدر", "الوجهة", "الحالة", "القيمة"] : ["Date", "Item", "Quantity", "Source", "Destination", "Status", "Value"], rows: requestRows },
  ];
  const excelHeaders = ar ? ["القسم", "التاريخ/الكود", "الصنف", "النوع/التفصيل", "الكمية", "من/المورد", "إلى/الحالة", "القيمة"] : ["Section", "Date/Code", "Item", "Type/Detail", "Quantity", "From/Supplier", "To/Status", "Value"];
  const excelRows = [
    ...stock.map((item) => [ar ? "المخزون" : "Stock", item.itemCode, item.name, item.stationQuantity <= value(item.minimumStock) ? (ar ? "منخفض" : "Low") : (ar ? "متوفر" : "Available"), item.stationQuantity, allStations ? locationName(item.reportStationId) : "—", "—", "—"]),
    ...purchases.map((entry) => [ar ? "المشتريات" : "Purchases", date(entry.purchaseDate || entry.created_date), itemName(entry.itemId), type(entry.movementType), value(entry.quantity), entry.supplierName || "—", locationName(entry.toLocationId), value(entry.totalCost)]),
    ...stationMovements.map((entry) => [ar ? "الحركات" : "Movements", date(entry.created_date), itemName(entry.itemId), type(entry.movementType), value(entry.quantity), locationName(entry.fromLocationId), locationName(entry.toLocationId), "—"]),
    ...stationRequests.map((entry) => [ar ? "الطلبات" : "Requests", date(entry.created_date), itemName(entry.itemId), requestStatus(entry.status), value(entry.quantity), locationName(entry.sourceStationId), locationName(entry.stationId), value(entry.totalCost)]),
  ];
  return { title: ar ? `تقرير المخزون الشامل — ${stationName}` : `Comprehensive Inventory Report — ${stationName}`, stationName, sections, excelHeaders, excelRows, stats: [{ label: ar ? "الأصناف" : "Items", value: stock.length }, { label: ar ? "إجمالي الوحدات" : "Total units", value: totalQuantity }, { label: ar ? "مخزون منخفض" : "Low stock", value: lowStock }, { label: ar ? "الحركات" : "Movements", value: stationMovements.length }, { label: ar ? "قيمة المشتريات" : "Purchase value", value: purchaseValue.toFixed(2) }] };
}