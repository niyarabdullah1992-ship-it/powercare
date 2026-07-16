// Ready-made Excel payroll template: pre-filled with every employee and their
// current amounts. HR edits the numbers in Excel and re-uploads the file — the
// smart import matches rows by email (exact) and applies everything.
import { getRun } from "@/lib/payroll";

const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function downloadPayrollTemplate(data, month, ar, employees = data.employees || []) {
  const run = getRun(data, month);
  const itemOf = (id) => (run?.items || []).find((i) => i.employeeId === id);

  const headers = ["email", "name", "base_salary", "allowances", "bonus", "deductions", "currency"];
  const rows = employees.map((e) => {
    const p = e.profile || {};
    const i = itemOf(e.id) || {};
    return [
      e.email || "", e.name,
      i.base ?? p.baseSalary ?? 0,
      i.allowances ?? p.allowances ?? 0,
      i.bonus ?? 0,
      i.deductions ?? 0,
      i.currency || p.currency || "SAR",
    ];
  });

  const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${ar ? "رواتب" : "payroll"}_${month}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}