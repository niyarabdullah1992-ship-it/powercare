export const INVENTORY_REPORT_THEMES = [
  { value: "inventoryOperations", labelAr: "شبكة العمليات", labelEn: "Operations Grid" },
  { value: "inventoryCommand", labelAr: "سجل القيادة", labelEn: "Command Ledger" },
  { value: "inventoryField", labelAr: "السجل الميداني", labelEn: "Field Register" },
];

export function inventoryThemeClass(theme) {
  return INVENTORY_REPORT_THEMES.some((item) => item.value === theme)
    ? `inventory-powercare ${theme.replace("inventory", "inventory-").toLowerCase()}`
    : "";
}

export const INVENTORY_REPORT_CSS = `
  .inventory-powercare { color:#13283d; background:#faf7f2; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .inventory-powercare .institutional-art { opacity:.07; border-color:#e0a43b; background-color:#faf7f2; background-image:linear-gradient(#e0a43b 1px,transparent 1px),linear-gradient(90deg,#e0a43b 1px,transparent 1px); }
  .inventory-powercare .top-rule { height:9px; background:linear-gradient(90deg,#13283d 0 68%,#e0a43b 68% 86%,#f0c56d 86% 100%); }
  .inventory-powercare .head { padding:16px 18px; border:0; border-bottom:2px solid #e0a43b; border-inline-start:5px solid #e0a43b; background:#13283d; }
  .inventory-powercare .head h1 { color:#faf7f2; font-size:25px; }
  .inventory-powercare .head .meta { color:#faf7f2; opacity:.72; }
  .inventory-powercare .document-label { color:#f0c56d; letter-spacing:.22em; }
  .inventory-powercare .report-mark { border-color:#e0a43b; background:#13283d; color:#f0c56d; }
  .inventory-powercare .head img { padding:4px; background:#faf7f2; }
  .inventory-powercare .stats { gap:8px; margin-bottom:18px; }
  .inventory-powercare .stat { min-width:100px; padding:10px 12px; border:1px solid #ddd8cc; border-top:4px solid #e0a43b; background:#faf7f2; box-shadow:0 3px 9px rgba(19,40,61,.07); }
  .inventory-powercare .stat .val { color:#13283d; font-size:23px; }
  .inventory-powercare .stat .lbl { color:#657383; font-size:9px; }
  .inventory-powercare h2 { margin-top:20px; padding:8px 11px; border:0; border-inline-start:5px solid #e0a43b; background:#f1eadc; color:#13283d; }
  .inventory-powercare h2::before { display:none; }
  .inventory-powercare .chart { margin:9px 0 14px; padding:11px; border-color:#ddd8cc; background:#faf7f2; box-shadow:0 2px 7px rgba(19,40,61,.05); }
  .inventory-powercare .chart h3,.inventory-powercare .bar-row strong { color:#13283d; }
  .inventory-powercare .bar-row i { border-color:#ddd8cc; background:#f1eadc; }
  .inventory-powercare .bar-row b { background:linear-gradient(90deg,#13283d,#e0a43b); }
  .inventory-powercare table { border:1px solid #d8d5cc; outline:0; box-shadow:0 2px 8px rgba(19,40,61,.05); font-size:9.5px; }
  .inventory-powercare th { padding:7px 6px; border-color:#29445f; background:#13283d; color:#f0c56d; font-size:8px; letter-spacing:.03em; }
  .inventory-powercare td { padding:6px; border:1px solid #e3e0d8; color:#13283d; }
  .inventory-powercare tr:nth-child(even) td { background:#faf8f2; }
  .inventory-powercare .foot { margin-top:20px; border-top:2px solid #e0a43b; color:#657383; font-size:9px; }
  .inventory-operations .report-mark::after { content:" OPS"; font-size:8px; }
  .inventory-command .top-rule { background:linear-gradient(90deg,#e0a43b 0 22%,#13283d 22% 100%); }
  .inventory-command .stat { border-top-color:#13283d; border-inline-start:3px solid #e0a43b; }
  .inventory-command h2 { color:#f0c56d; background:#13283d; }
  .inventory-command table { border-top:4px double #e0a43b; border-bottom:4px double #e0a43b; box-shadow:none; }
  .inventory-command .report-mark::after { content:" CMD"; font-size:8px; }
  .inventory-field .head { background:#faf7f2; border:2px solid #13283d; border-inline-start:8px solid #e0a43b; }
  .inventory-field .head h1,.inventory-field .head .meta { color:#13283d; }
  .inventory-field .document-label { color:#a67219; }
  .inventory-field .report-mark { background:#faf7f2; color:#13283d; }
  .inventory-field .stat { box-shadow:none; border-radius:0; }
  .inventory-field h2 { border-block:1px solid #d8d5cc; background:#fff; }
  .inventory-field table { box-shadow:none; }
  .inventory-field tbody tr td:first-child { border-inline-start:3px solid #e0a43b; font-weight:700; }
  .inventory-field .report-mark::after { content:" FLD"; font-size:8px; }
  @media print { .inventory-powercare { background:#faf7f2 !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
`;