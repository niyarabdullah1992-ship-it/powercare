export const PDF_THEME = {
  ink: "#14284B",
  inkSoft: "#29445f",
  navy: "#14284B",
  accent: "#1E9E63",
  cream: "#F7F8FA",
  creamDeep: "#F1F5F9",
  muted: "#5A6B85",
  line: "#E2E8F0",
};

export const LEGACY_GOLD = new Set(["#b07d3f", "#e0a43b", "#d4af37", "#c9a227"]);

export function brandReportColor(color) {
  const next = String(color || "").trim().toLowerCase();
  if (!next || LEGACY_GOLD.has(next)) return PDF_THEME.navy;
  return color;
}

/** Shared print sheet — navy identity, no decorative stamp. */
export const CLEAN_PRINT_CSS = `
  @page { margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: #14284B; font-family: Tahoma, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .rule { height: 3px; background: #14284B; }
  .kicker { font-size: 10px; letter-spacing: .16em; font-weight: 600; color: #5A6B85; }
  h1 { margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #14284B; }
  .meta { color: #5A6B85; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #14284B; color: #fff; text-align: start; padding: 8px; }
  td { padding: 8px; border-bottom: 1px solid #E2E8F0; color: #14284B; }
  tr:nth-child(even) td { background: #F7F8FA; }
  .foot { margin-top: 16px; padding-top: 8px; border-top: 1px solid #E2E8F0; color: #5A6B85; font-size: 10px; }
`;