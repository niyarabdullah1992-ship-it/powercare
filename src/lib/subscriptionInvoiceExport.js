import { exportExcelColored } from "@/lib/exportExcelColored";
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
const esc = (value) => String(value ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
  const dir = ar ? "rtl" : "ltr";
  const cards = rows.map((item) => {
    const currency = item.currency || "USD";
    const totals = subscriptionTotals(subscriptionBillableAmount(item));
    const formatted = (value) => formatSubscriptionMoney(value, currency, ar);
    const issueDate = new Date(item.startedAt || Date.now()).toLocaleDateString(ar ? "ar-SA" : "en-GB");
    const cycle = item.billing === "yearly" ? (ar ? "سنوي / Yearly" : "Yearly / سنوي") : (ar ? "شهري / Monthly" : "Monthly / شهري");
    const line = (label, value, total = false) => `<div class="line${total ? " total" : ""}"><span>${esc(value)}</span><small>${esc(label)}</small></div>`;
    return `<article class="statement"><div class="statement-head"><div><small>${ar ? "رقم البيان / Statement number" : "Statement number / رقم البيان"}</small><strong>${esc(subscriptionInvoiceNumber(item))}</strong></div><span class="badge">${ar ? "بيان اشتراك" : "SUBSCRIPTION"}</span></div><section class="customer"><div><small>${ar ? "العميل / Customer" : "Customer / العميل"}</small><b>${esc(item.companyName || "—")}</b><p>${esc(item.email || "—")}</p></div><div><small>${ar ? "تاريخ الإصدار / Issue date" : "Issue date / تاريخ الإصدار"}</small><b>${esc(issueDate)}</b></div></section><section class="service"><h2>${ar ? "تفاصيل الاشتراك / Subscription details" : "Subscription details / تفاصيل الاشتراك"}</h2>${line(ar ? "الباقة / Plan" : "Plan / الباقة", item.plan || "—")}${line(ar ? "دورة الفوترة / Billing cycle" : "Billing cycle / دورة الفوترة", cycle)}${line(ar ? "العملة / Currency" : "Currency / العملة", currency)}</section><section class="totals">${line(ar ? "المبلغ قبل الضريبة / Subtotal" : "Subtotal / المبلغ قبل الضريبة", formatted(totals.subtotal))}${line(ar ? "ضريبة القيمة المضافة (15%) / VAT" : "VAT (15%) / ضريبة القيمة المضافة", formatted(totals.vat))}${line(ar ? "الإجمالي شامل الضريبة / Total" : "Total including VAT / الإجمالي", formatted(totals.total), true)}</section></article>`;
  }).join("");
  const html = `<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><title>${esc(title || (ar ? "بيان الاشتراك" : "Subscription statement"))}</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{margin:0;background:#fff;color:#f8fafc;font-family:Tahoma,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{width:210mm;min-height:297mm;padding:18mm 22mm;background:#071c2a url('https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/41a16d83e_generated_image.png') center/cover fixed no-repeat}.shell{min-height:261mm;padding:10mm 12mm;border:1px solid rgba(255,255,255,.18);border-radius:8mm;background:linear-gradient(145deg,rgba(12,42,59,.86),rgba(4,22,34,.68));box-shadow:0 12mm 30mm rgba(0,0,0,.2),inset 0 1px rgba(255,255,255,.14);backdrop-filter:blur(18px)}header{text-align:center}.brand{font-size:18px;letter-spacing:.04em}.brand b{font-weight:800}.gold{color:#d4af37}h1{margin:5mm 0 2mm;font-size:18px;font-weight:400}header p{margin:0;color:rgba(248,250,252,.65);font-size:9px}.statement{margin-top:8mm;padding:7mm;border:1px solid rgba(255,255,255,.26);border-radius:6mm;background:linear-gradient(135deg,rgba(255,255,255,.14),rgba(255,255,255,.055));box-shadow:0 8mm 20mm rgba(0,0,0,.2),inset 0 1px rgba(255,255,255,.16);backdrop-filter:blur(14px);break-inside:avoid}.statement-head{display:flex;align-items:center;justify-content:space-between;padding-bottom:5mm;border-bottom:1px solid rgba(255,255,255,.16)}.statement-head small,.customer small,.service small,.totals small{display:block;margin-bottom:1.5mm;color:rgba(248,250,252,.62);font-size:8px}.statement-head strong{display:block;font:700 13px monospace}.badge{padding:2mm 4mm;border:1px solid rgba(226,195,104,.58);border-radius:99px;color:#f0cf72;background:linear-gradient(135deg,rgba(212,175,55,.16),rgba(255,255,255,.04));box-shadow:inset 0 1px rgba(255,255,255,.12),0 2mm 6mm rgba(0,0,0,.12);font-size:8px;font-weight:700;letter-spacing:.08em}.customer{display:grid;grid-template-columns:2fr 1fr;gap:8mm;padding:6mm 0}.customer b{font-size:15px}.customer p{margin:1.5mm 0 0;color:rgba(248,250,252,.66);font-size:9px}.service,.totals{padding:5mm 6mm;border:1px solid rgba(255,255,255,.18);border-radius:5mm;background:linear-gradient(120deg,rgba(255,255,255,.1),rgba(255,255,255,.035));box-shadow:inset 0 1px rgba(255,255,255,.1)}.service h2{margin:0 0 3mm;text-align:end;font-size:11px}.line{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8mm;padding:2mm 0;font-size:10px}.line>span{text-align:start}.line>small{text-align:end;margin:0}.totals{margin-top:4mm}.totals .total{margin-top:2mm;padding-top:4mm;border-top:1px solid rgba(212,175,55,.34);font-size:16px;font-weight:800}.totals .total>span{color:#d4af37}.footer{margin-top:7mm;text-align:center;color:rgba(248,250,252,.65);font-size:8px;line-height:1.8}</style></head><body><main class="page"><section class="shell"><header><div class="brand"><b>POWERCARE</b> <span class="gold">•</span> SUBSCRIPTION STATEMENT</div><h1>${ar ? "بيان الاشتراك الداخلي" : "Internal subscription statement"}</h1><p>${ar ? "وثيقة مالية داخلية منشأة إلكترونيًا" : "Electronically generated internal financial document"}</p></header>${cards}<div class="footer">PowerCare <span class="gold">•</span> ${new Date().toLocaleDateString(ar ? "ar-SA" : "en-GB")}</div></section></main><script>onload=()=>setTimeout(()=>print(),500)</script></body></html>`;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}