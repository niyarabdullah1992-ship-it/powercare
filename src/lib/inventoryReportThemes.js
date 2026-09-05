export const INVENTORY_REPORT_THEMES = [
  { value: "inventorySimplified", labelAr: "بطاقات المؤشرات المبسطة", labelEn: "Simplified Metric Cards" },
  { value: "inventoryCommand", labelAr: "سجل القيادة", labelEn: "Command Ledger" },
  { value: "inventoryField", labelAr: "السجل الميداني", labelEn: "Field Register" },
];

export function inventoryThemeClass(theme) {
  return INVENTORY_REPORT_THEMES.some((item) => item.value === theme)
    ? `inventory-powercare ${theme.replace("inventory", "inventory-").toLowerCase()}`
    : "";
}

export const INVENTORY_REPORT_CSS = `
  .inventory-powercare { color:#14284B; background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .inventory-powercare .head { padding:0 0 16px; border:0; border-bottom:1px solid #E2E8F0; background:#fff; }
  .inventory-powercare .head h1 { color:#14284B; font-size:22px; }
  .inventory-powercare .head .meta { color:#5A6B85; }
  .inventory-powercare .document-label { color:#5A6B85; letter-spacing:.16em; }
  .inventory-powercare .head img { padding:0; background:transparent; }
  .inventory-powercare .stats { gap:8px; margin-bottom:18px; }
  .inventory-powercare .stat { min-width:100px; padding:10px 12px; border:1px solid #E2E8F0; border-top:4px solid #1E9E63; background:#F7F8FA; box-shadow:0 3px 9px rgba(19,40,61,.07); }
  .inventory-powercare .stat .val { color:#14284B; font-size:23px; }
  .inventory-powercare .stat .lbl { color:#657383; font-size:9px; }
  .inventory-powercare h2 { margin-top:20px; padding:8px 11px; border:0; border-inline-start:5px solid #1E9E63; background:#F7F8FA; color:#14284B; }
  .inventory-powercare h2::before { display:none; }
  .inventory-powercare .chart { margin:9px 0 14px; padding:11px; border-color:#E2E8F0; background:#F7F8FA; box-shadow:0 2px 7px rgba(19,40,61,.05); }
  .inventory-powercare .chart h3,.inventory-powercare .bar-row strong { color:#14284B; }
  .inventory-powercare .bar-row i { border-color:#E2E8F0; background:#F7F8FA; }
  .inventory-powercare .bar-row b { background:linear-gradient(90deg,#14284B,#1E9E63); }
  .inventory-powercare table { border:1px solid #E2E8F0; outline:0; box-shadow:0 2px 8px rgba(19,40,61,.05); font-size:9.5px; }
  .inventory-powercare th { padding:7px 6px; border-color:#29445f; background:#14284B; color:#fff; font-size:8px; letter-spacing:.03em; }
  .inventory-powercare td { padding:6px; border:1px solid #E2E8F0; color:#14284B; }
  .inventory-powercare tr:nth-child(even) td { background:#F7F8FA; }
  .inventory-powercare .foot { margin-top:20px; border-top:2px solid #1E9E63; color:#657383; font-size:9px; }
  .inventory-simplified { background:#ffffff; padding:28px; }
  .inventory-simplified .head { direction:inherit; align-items:flex-start; margin:0 0 18px; padding:0; border:0; background:#ffffff; }
  .inventory-simplified .identity { align-items:flex-start; }
  .inventory-simplified .head h1 { color:#14284B; font:700 24px Tahoma,"Segoe UI",Arial,sans-serif; }
  .inventory-simplified .head .meta { margin-top:5px; color:#5A6B85; font-size:11px; opacity:1; }
  .inventory-simplified .stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin:0 0 16px; }
  .inventory-simplified .stat { display:flex; min-width:0; min-height:112px; flex-direction:column; align-items:center; justify-content:center; padding:12px 8px; border:1px solid #E2E8F0; border-top:8px solid #1E9E63; border-radius:8px; background:#ffffff; box-shadow:none; text-align:center; }
  .inventory-simplified .stat .lbl { order:1; margin:0 0 12px; color:#111827; font-size:10px; line-height:1.4; }
  .inventory-simplified .stat .val { order:2; color:#142442; font:700 23px Tahoma,"Segoe UI",Arial,sans-serif; }
  .inventory-simplified h2 { margin:15px 0 6px; padding:0; border:0; background:transparent; color:#142442; font:700 16px Tahoma,"Segoe UI",Arial,sans-serif; text-align:start; }
  .inventory-simplified .chart { display:none; }
  .inventory-simplified table { margin-bottom:10px; border:0; border-collapse:separate; border-spacing:2px; background:#ffffff; box-shadow:none; table-layout:auto; font-size:9px; }
  .inventory-simplified th { padding:7px 5px; border:0; border-radius:5px; background:#142442; color:#ffffff; font-size:8px; font-weight:500; letter-spacing:0; text-align:center; }
  .inventory-simplified td,.inventory-simplified tr:nth-child(even) td { padding:6px 5px; border:0; border-radius:4px; background:#F7F8FA; color:#14284B; text-align:center; }
  .inventory-simplified .foot { justify-content:flex-start; margin-top:14px; padding:0; border:0; color:#142442; font-size:10px; font-weight:600; }
  .inventory-simplified .foot span:first-child { display:none; }
  html[dir="rtl"] .inventory-simplified .foot span:last-child::before { content:"تاريخ إنشاء التقرير: "; }
  html[dir="ltr"] .inventory-simplified .foot span:last-child::before { content:"Report generated: "; }
  .inventory-command .stat { border-top-color:#14284B; }
  .inventory-command h2 { color:#fff; background:#14284B; }
  .inventory-command table { box-shadow:none; }
  .inventory-field .head { background:#fff; border-bottom:1px solid #E2E8F0; }
  .inventory-field .head h1,.inventory-field .head .meta { color:#14284B; }
  .inventory-field .document-label { color:#5A6B85; }
  .inventory-field .stat { box-shadow:none; border-radius:0; }
  .inventory-field h2 { border-block:1px solid #E2E8F0; background:#fff; }
  .inventory-field table { box-shadow:none; }
  @media print { .inventory-powercare { background:#F7F8FA !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
`;