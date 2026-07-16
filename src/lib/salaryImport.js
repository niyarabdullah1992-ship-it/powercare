// Smart salary import: extracts salary rows from an uploaded file (PDF, Excel,
// CSV or image) using AI, matches each row to a company employee, and applies
// the amounts to both the employee's salary profile and the month's payroll run.
import { base44 } from "@/api/base44Client";
import { updateCompany } from "@/lib/store";

const ROW_SCHEMA = {
  type: "object",
  properties: {
    rows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Employee full name as written in the file" },
          email: { type: "string", description: "Employee email if present, else empty" },
          base_salary: { type: "number", description: "Base/basic monthly salary amount" },
          allowances: { type: "number", description: "Total allowances amount (0 if none)" },
          bonus: { type: "number", description: "Bonus amount (0 if none)" },
          deductions: { type: "number", description: "Total deductions amount (0 if none)" },
          currency: { type: "string", description: "Currency code like SAR, USD (empty if not stated)" },
        },
      },
    },
  },
};

const parseCsvLine = (line) => {
  const cells = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') { value += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { cells.push(value.trim()); value = ""; }
    else value += char;
  }
  cells.push(value.trim());
  return cells;
};

const parseTemplateCsv = async (file) => {
  const lines = (await file.text()).replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => Object.fromEntries(headers.map((h, i) => [h, parseCsvLine(line)[i] || ""])));
};

// CSV templates are parsed locally for reliable, instant imports. Native Excel
// files use the structured file extractor, with the vision model as fallback.
export async function extractSalaryRows(file) {
  if (/\.csv$/i.test(file.name)) return (await parseTemplateCsv(file)).filter((r) => r.name || r.email);
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({ file_url, json_schema: ROW_SCHEMA });
  let rows = extracted?.status === "success" ? extracted.output?.rows || extracted.output || [] : null;
  if (!rows || rows.length === 0) {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: "This file is a company salary sheet. Extract every employee salary row exactly as written: full name, email (if any), base/basic salary, total allowances, bonus, total deductions, and currency code. Amounts are numbers only (no separators).",
      file_urls: [file_url],
      response_json_schema: ROW_SCHEMA,
    });
    rows = res?.rows || [];
  }
  return (Array.isArray(rows) ? rows : []).filter((r) => r && (r.name || r.email));
}

const norm = (s) => String(s || "").toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/\s+/g, " ").trim();
const amount = (value) => Number(String(value ?? "0").replace(/[٬,\s]/g, "")) || 0;

// Matches extracted rows to employees: email first, then exact normalized name,
// then partial name containment. Returns [{ row, employee|null }].
export function matchRowsToEmployees(rows, employees) {
  return rows.map((row) => {
    const email = norm(row.email);
    const name = norm(row.name);
    let employee =
      (email && employees.find((e) => norm(e.email) === email)) ||
      employees.find((e) => norm(e.name) === name) ||
      employees.find((e) => name && (norm(e.name).includes(name) || name.includes(norm(e.name)))) ||
      null;
    return { row, employee };
  });
}

// Applies matched salaries in one mutation: updates each employee's salary
// profile (source of truth for future months) and the selected month's run.
export function applySalaryImport(companyId, month, matches) {
  updateCompany(companyId, (d) => {
    matches.forEach(({ row, employee }) => {
      if (!employee) return;
      const emp = d.employees.find((e) => e.id === employee.id);
      if (!emp) return;
      emp.profile = emp.profile || {};
      emp.profile.baseSalary = amount(row.base_salary);
      emp.profile.allowances = amount(row.allowances);
      if (row.currency) emp.profile.currency = String(row.currency).toUpperCase();

      const run = (d.payrollRuns || []).find((r) => r.month === month);
      const item = run?.items.find((i) => i.employeeId === emp.id);
      if (item && !item.paid) {
        item.base = amount(row.base_salary);
        item.allowances = amount(row.allowances);
        item.bonus = amount(row.bonus);
        item.deductions = amount(row.deductions);
        if (row.currency) item.currency = String(row.currency).toUpperCase();
      }
    });
  });
}