import React from "react";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";

const TYPES = { travel: ["Travel", "سفر"], accommodation: ["Accommodation", "سكن"], fuel: ["Fuel", "وقود"], overtime_meals: ["Overtime Meals", "وجبات العمل الإضافي"], tools_equipment: ["Tools & Equipment", "أدوات ومعدات"], training: ["Training", "تدريب"] };
const STATUSES = { submitted: ["Manager review", "مراجعة المدير"], manager_approved: ["Finance review", "مراجعة المالية"], manager_rejected: ["Manager rejected", "مرفوض من المدير"], finance_approved: ["Approved", "معتمد"], finance_rejected: ["Finance rejected", "مرفوض من المالية"] };

export default function ExpenseExportButtons({ claims, stations, ar, title }) {
  const stationNames = (claim) => (claim.stationIds?.length ? claim.stationIds : [claim.stationId]).map((id) => stations.find((station) => station.stationId === id)?.name || id).join(", ");
  const headers = ar
    ? ["التاريخ", "مقدم الطلب", "نوع المصروف", "المحطة", "المبلغ", "الإجمالي", "العملة", "الحالة"]
    : ["Date", "Requester", "Expense type", "Station", "Amount", "Total", "Currency", "Status"];
  const rows = claims.map((claim) => [
    claim.expenseDate,
    claim.requesterName,
    claim.expenseType === "other" ? claim.customExpenseType : TYPES[claim.expenseType]?.[ar ? 1 : 0],
    stationNames(claim),
    Number(claim.amount || 0),
    Number(claim.totalAmount || claim.amount || 0),
    claim.currency,
    STATUSES[claim.status]?.[ar ? 1 : 0] || claim.status,
  ]);
  return <ComparisonExportButtons title={title || (ar ? "تقرير المصروفات" : "Expense Report")} headers={headers} rows={rows} />;
}