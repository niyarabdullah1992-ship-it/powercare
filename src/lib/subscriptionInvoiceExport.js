import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import { subscriptionTotals, subscriptionBillableAmount, formatSubscriptionMoney } from "@/lib/subscriptionTax";

export const subscriptionInvoiceNumber = (row) => {
  const source = String(row.id || row.accountId || row.email || "invoice").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const year = new Date(row.startedAt || Date.now()).getFullYear();
  return `PC-${year}-${source.slice(-8).padStart(8, "0")}`;
};

export const subscriptionInvoiceRow = (row, ar) => {
  const currency = row.currency || "USD";
  const totals = subscriptionTotals(subscriptionBillableAmount(row));
  const money = (value) => formatSubscriptionMoney(value, currency, ar);
  return [subscriptionInvoiceNumber(row), row.companyName || "—", row.email || "—", row.plan || "—", row.billing === "yearly" ? (ar ? "سنوي" : "Yearly") : (ar ? "شهري" : "Monthly"), new Date(row.startedAt || Date.now()).toLocaleDateString(ar ? "ar-SA" : "en-GB"), currency, money(totals.subtotal), money(totals.vat), money(totals.total)];
};

const headers = (ar) => ar ? ["رقم الفاتورة", "الشركة", "البريد الإلكتروني", "الباقة", "الدورة", "تاريخ الإصدار", "العملة", "قبل الضريبة", "الضريبة 15%", "الإجمالي"] : ["Invoice number", "Company", "Email", "Plan", "Cycle", "Issue date", "Currency", "Before VAT", "VAT 15%", "Total"];

const rowsWithTotal = (rows, ar) => {
  const detailRows = rows.map((row) => subscriptionInvoiceRow(row, ar));
  const totals = subscriptionTotals(rows.reduce((sum, row) => sum + subscriptionBillableAmount(row), 0));
  const money = (value) => formatSubscriptionMoney(value, "USD", ar);
  return [...detailRows, [ar ? "الإجمالي" : "TOTAL", "", "", "", "", "", "USD", money(totals.subtotal), money(totals.vat), money(totals.total)]];
};

export function exportSubscriptionInvoicesExcel(rows, ar, filename = "subscription_invoices") {
  exportExcelColored({ filename, title: ar ? "فواتير الاشتراكات" : "Subscription invoices", headers: headers(ar), rows: rowsWithTotal(rows, ar), dir: ar ? "rtl" : "ltr", theme: "executiveGold" });
}

export function printSubscriptionInvoices(rows, ar, title) {
  printReport({ title: title || (ar ? "فواتير الاشتراكات" : "Subscription invoices"), companyName: "PowerCare", periodLabel: new Date().toLocaleDateString(ar ? "ar-SA" : "en-GB"), dir: ar ? "rtl" : "ltr", sections: [{ heading: ar ? "تفاصيل الفاتورة" : "Invoice details", headers: headers(ar), rows: rowsWithTotal(rows, ar) }], theme: "executiveGold" });
}