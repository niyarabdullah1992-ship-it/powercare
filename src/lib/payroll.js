// Payroll data layer — monthly runs built from each employee's salary profile
// (profile.baseSalary / allowances / currency, see SalaryTab). Stored in
// data.payrollRuns and cloud-synced like every other collection.
import { updateCompany } from "@/lib/store";

const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getRun(data, month) {
  return (data?.payrollRuns || []).find((r) => r.month === month) || null;
}

export const netOf = (i) =>
  (Number(i.base) || 0) + (Number(i.allowances) || 0) + (Number(i.bonus) || 0) - (Number(i.deductions) || 0);

export function payrollItemIssues(item) {
  const fields = ["base", "allowances", "bonus", "deductions"];
  if (fields.some((field) => !Number.isFinite(Number(item?.[field])) || Number(item[field]) < 0)) return ["INVALID_AMOUNTS"];
  if (Number(item?.base) <= 0) return ["BASE_REQUIRED"];
  if (netOf(item) <= 0) return ["NET_REQUIRED"];
  if (!/^[A-Z]{3}$/.test(String(item?.currency || ""))) return ["CURRENCY_REQUIRED"];
  return [];
}

// Creates the month's run from current salary profiles if missing, and adds
// items for any employee hired after the run was first generated.
export function ensurePayrollRun(companyId, month) {
  updateCompany(companyId, (d) => {
    d.payrollRuns = d.payrollRuns || [];
    let run = d.payrollRuns.find((r) => r.month === month);
    if (!run) {
      run = { id: uid("run"), month, createdAt: new Date().toISOString(), items: [] };
      d.payrollRuns.push(run);
    }
    const existing = new Set(run.items.map((item) => item.employeeId));
    (d.employees || []).forEach((employee) => {
      const hiredMonth = employee.createdAt ? monthKey(new Date(employee.createdAt)) : month;
      if (existing.has(employee.id) || hiredMonth > month) return;
      const profile = employee.profile || {};
      const currency = String(profile.currency || "SAR").toUpperCase();
      run.items.push({
        id: uid("itm"), employeeId: employee.id,
        employeeName: employee.name, employeePosition: employee.position || employee.role || "", employeeStationId: employee.stationId || null,
        base: Number(profile.baseSalary) || 0, allowances: Number(profile.allowances) || 0,
        bonus: 0, deductions: 0, currency: /^[A-Z]{3}$/.test(currency) ? currency : "SAR", paid: false,
      });
    });
    run.items.forEach((item) => {
      if (!item.paid) {
        const currency = String(item.currency || "SAR").toUpperCase();
        item.currency = /^[A-Z]{3}$/.test(currency) ? currency : "SAR";
      }
    });
  });
}

export function updatePayrollItem(companyId, month, itemId, updates) {
  updateCompany(companyId, (d) => {
    const run = (d.payrollRuns || []).find((r) => r.month === month);
    const item = run?.items.find((i) => i.id === itemId);
    if (!item || item.paid) return;
    const allowed = ["base", "allowances", "bonus", "deductions", "currency"];
    for (const [field, value] of Object.entries(updates || {})) {
      if (!allowed.includes(field)) continue;
      if (field === "currency") item.currency = String(value || "").toUpperCase().slice(0, 3);
      else if (Number.isFinite(Number(value)) && Number(value) >= 0) item[field] = Number(value);
    }
  });
}

export function setItemPaid(companyId, month, itemId, paid) {
  updateCompany(companyId, (d) => {
    const run = (d.payrollRuns || []).find((r) => r.month === month);
    const item = run?.items.find((i) => i.id === itemId);
    if (!item || (paid && payrollItemIssues(item).length > 0)) return;
    item.paid = paid;
    item.paidAt = paid ? new Date().toISOString() : null;
  });
}