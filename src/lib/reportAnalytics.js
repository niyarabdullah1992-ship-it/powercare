const STATION_TERMS = ["station", "site", "المحطة", "الموقع"];
const EMPLOYEE_TERMS = ["employee", "requester", "assignee", "staff", "الموظف", "مقدم الطلب", "المسند إليه"];

const numberValue = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value ?? "").trim();
  if (!text || /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(text)) return null;
  const cleaned = text.replace(/[٬،,\s]/g, "").replace(/[%$€£]|SAR|ر\.س/gi, "");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
};

const includesTerm = (header, terms) => terms.some((term) => String(header).toLowerCase().includes(term));
const format = (value) => Number(value.toFixed(2)).toLocaleString("en-US");

function makeChart(title, entries) {
  const clean = entries.filter((entry) => entry.label && Number.isFinite(entry.value)).slice(0, 12);
  const max = Math.max(...clean.map((entry) => Math.abs(entry.value)), 1);
  return { title, entries: clean.map((entry) => ({ ...entry, display: format(entry.value), percent: Math.max(3, Math.round((Math.abs(entry.value) / max) * 100)) })) };
}

export function deriveReportAnalytics(headers = [], rows = []) {
  const dataRows = rows.filter((row) => Array.isArray(row) && row.length === headers.length);
  if (!dataRows.length) return { stats: [], charts: [] };
  const ar = headers.some((header) => /[\u0600-\u06ff]/.test(String(header)));
  const numericIndexes = headers.map((_, index) => index).filter((index) => dataRows.filter((row) => numberValue(row[index]) !== null).length >= Math.max(2, Math.ceil(dataRows.length * 0.5)));
  const metricIndex = numericIndexes.at(-1);
  const stats = numericIndexes.slice(-4).map((index) => ({ label: `${ar ? "إجمالي" : "Total"} ${headers[index]}`, value: format(dataRows.reduce((sum, row) => sum + (numberValue(row[index]) || 0), 0)) }));
  if (metricIndex === undefined) return { stats: [{ label: ar ? "إجمالي السجلات" : "Total records", value: dataRows.length }], charts: [] };

  const labelIndex = headers.findIndex((_, index) => index !== metricIndex && !numericIndexes.includes(index));
  const charts = [];
  if (labelIndex >= 0) charts.push(makeChart(ar ? "نظرة تنفيذية" : "Executive overview", dataRows.map((row) => ({ label: String(row[labelIndex] || "—"), value: numberValue(row[metricIndex]) || 0 }))));

  [[STATION_TERMS, ar ? "تحليل حسب المحطة" : "Analysis by station"], [EMPLOYEE_TERMS, ar ? "تحليل حسب الموظف" : "Analysis by employee"]].forEach(([terms, title]) => {
    const groupIndex = headers.findIndex((header) => includesTerm(header, terms));
    if (groupIndex < 0) return;
    const grouped = new Map();
    dataRows.forEach((row) => { const key = String(row[groupIndex] || "—"); grouped.set(key, (grouped.get(key) || 0) + (numberValue(row[metricIndex]) || 0)); });
    charts.push(makeChart(title, [...grouped].map(([label, value]) => ({ label, value }))));
  });
  return { stats, charts: charts.filter((chart) => chart.entries.length) };
}