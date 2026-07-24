const THEMES = [
  { key: "tasks", terms: ["task", "مهام", "المهام"], mark: "✓", label: "WORKFLOW CONTROL", layout: "workflow" },
  { key: "payroll", terms: ["payroll", "salary", "رواتب", "الرواتب"], mark: "SAR", label: "PAYROLL LEDGER", layout: "ledger" },
  { key: "inventory", terms: ["inventory", "stock", "material", "مخزون", "مواد"], mark: "▦", label: "STOCK REGISTER", layout: "grid" },
  { key: "expenses", terms: ["expense", "cost", "مصروف", "تكاليف"], mark: "◇", label: "FINANCIAL RECORD", layout: "receipt" },
  { key: "safety", terms: ["safety", "hse", "incident", "سلامة", "حوادث"], mark: "HSE", label: "SAFETY CONTROL", layout: "shield" },
  { key: "attendance", terms: ["attendance", "schedule", "حضور", "دوام", "جدول"], mark: "◷", label: "TIME REGISTER", layout: "timeline" },
  { key: "people", terms: ["employee", "leave", "certificate", "موظف", "إجاز", "شهاد"], mark: "HR", label: "PEOPLE DIRECTORY", layout: "profile" },
  { key: "performance", terms: ["performance", "point", "أداء", "نقاط"], mark: "★", label: "PERFORMANCE REVIEW", layout: "award" },
  { key: "stations", terms: ["station", "site", "محط", "موقع"], mark: "⌂", label: "SITE DIRECTORY", layout: "blueprint" },
  { key: "documents", terms: ["document", "file", "sign", "ملف", "مستند", "توقيع"], mark: "DOC", label: "DOCUMENT REGISTER", layout: "certificate" },
];

export function getReportVisualTheme(title = "") {
  const normalized = String(title).toLowerCase();
  return THEMES.find((item) => item.terms.some((term) => normalized.includes(term))) || { key: "general", mark: "PC", label: "OFFICIAL REPORT", layout: "classic" };
}