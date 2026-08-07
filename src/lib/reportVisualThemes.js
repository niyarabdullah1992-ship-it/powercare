const THEMES = [
  { key: "tasks", terms: ["task", "مهام", "المهام"], mark: "✓", label: "WORKFLOW CONTROL", layout: "workflow", accent: "#b58b3e", pattern: "lines" },
  { key: "payroll", terms: ["payroll", "salary", "رواتب", "الرواتب"], mark: "SAR", label: "PAYROLL LEDGER", layout: "ledger", accent: "#9b793b", pattern: "lines" },
  { key: "inventory", terms: ["inventory", "stock", "material", "مخزون", "مواد"], mark: "▦", label: "STOCK REGISTER", layout: "grid", accent: "#4e7b72", pattern: "grid" },
  { key: "expenses", terms: ["expense", "cost", "مصروف", "تكاليف"], mark: "◇", label: "FINANCIAL RECORD", layout: "receipt", accent: "#a46d4c", pattern: "rings" },
  { key: "safety", terms: ["safety", "hse", "incident", "سلامة", "حوادث"], mark: "HSE", label: "SAFETY CONTROL", layout: "shield", accent: "#9b554f", pattern: "rings" },
  { key: "attendance", terms: ["attendance", "schedule", "حضور", "دوام", "جدول"], mark: "◷", label: "TIME REGISTER", layout: "timeline", accent: "#55768f", pattern: "rings" },
  { key: "people", terms: ["employee", "leave", "certificate", "موظف", "إجاز", "شهاد"], mark: "HR", label: "PEOPLE DIRECTORY", layout: "profile", accent: "#79658c", pattern: "rings" },
  { key: "performance", terms: ["performance", "point", "أداء", "نقاط"], mark: "★", label: "PERFORMANCE REVIEW", layout: "award", accent: "#b58b3e", pattern: "rings" },
  { key: "stations", terms: ["station", "site", "محط", "موقع"], mark: "⌂", label: "SITE DIRECTORY", layout: "blueprint", accent: "#397483", pattern: "grid" },
  { key: "documents", terms: ["document", "file", "sign", "ملف", "مستند", "توقيع"], mark: "DOC", label: "DOCUMENT REGISTER", layout: "certificate", accent: "#8b6f45", pattern: "lines" },
];

export function getReportVisualTheme(title = "") {
  const normalized = String(title).toLowerCase();
  return THEMES.find((item) => item.terms.some((term) => normalized.includes(term))) || { key: "general", mark: "PC", label: "OFFICIAL REPORT", layout: "classic", accent: "#b58b3e", pattern: "lines" };
}