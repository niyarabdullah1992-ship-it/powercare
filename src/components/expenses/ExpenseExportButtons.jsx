import React from "react";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";

const TYPES = { travel: ["Travel", "سفر"], accommodation: ["Accommodation", "سكن"], fuel: ["Fuel", "وقود"], overtime_meals: ["Overtime Meals", "وجبات العمل الإضافي"], tools_equipment: ["Tools & Equipment", "أدوات ومعدات"], training: ["Training", "تدريب"] };
const STATUSES = { submitted: ["Manager review", "مراجعة المدير"], manager_approved: ["Finance review", "مراجعة المالية"], manager_rejected: ["Manager rejected", "مرفوض من المدير"], finance_approved: ["Approved", "معتمد"], finance_rejected: ["Finance rejected", "مرفوض من المالية"] };

export default function ExpenseExportButtons({ claims, stations, ar, title }) {
  const stationNames = (claim) => (claim.stationIds?.length ? claim.stationIds : [claim.stationId]).map((id) => stations.find((station) => station.stationId === id)?.name || id).join(", ");
  const headers = ar
    ? ["التاريخ", "رقم الفاتورة", "مقدم الطلب", "نوع المصروف", "الكمية", "المحطة", "قبل الضريبة", "الضريبة", "بعد الضريبة", "الإجمالي", "العملة", "الحالة"]
    : ["Date", "Invoice number", "Requester", "Expense type", "Quantity", "Station", "Before tax", "Tax", "After tax", "Total", "Currency", "Status"];
  const rows = claims.map((claim) => [
    claim.expenseDate,
    claim.invoiceNumber || "",
    claim.requesterName,
    claim.expenseType === "other" ? claim.customExpenseType : TYPES[claim.expenseType]?.[ar ? 1 : 0],
    claim.quantity ?? claim.itemCount ?? "",
    stationNames(claim),
    Number(claim.beforeTaxAmount ?? claim.amount ?? 0),
    Number(claim.taxAmount || 0),
    Number(claim.afterTaxAmount ?? claim.amount ?? 0),
    Number(claim.totalAmount || claim.amount || 0),
    claim.currency,
    STATUSES[claim.status]?.[ar ? 1 : 0] || claim.status,
  ]);
  return <ComparisonExportButtons title={title || (ar ? "تقرير المصروفات" : "Expense Report")} headers={headers} rows={rows} compact />;
}