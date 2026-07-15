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
    const existing = new Set(run.items.map((i) => i.employeeId));
    (d.employees || []).forEach((e) => {
      if (existing.has(e.id)) return;
      const p = e.profile || {};
      run.items.push({
        id: uid("itm"), employeeId: e.id,
        base: Number(p.baseSalary) || 0, allowances: Number(p.allowances) || 0,
        bonus: 0, deductions: 0, currency: p.currency || "SAR", paid: false,
      });
    });
  });
}

export function updatePayrollItem(companyId, month, itemId, updates) {
  updateCompany(companyId, (d) => {
    const run = (d.payrollRuns || []).find((r) => r.month === month);
    const item = run?.items.find((i) => i.id === itemId);
    if (item) Object.assign(item, updates);
  });
}

export function setItemPaid(companyId, month, itemId, paid) {
  updateCompany(companyId, (d) => {
    const run = (d.payrollRuns || []).find((r) => r.month === month);
    const item = run?.items.find((i) => i.id === itemId);
    if (!item) return;
    item.paid = paid;
    item.paidAt = paid ? new Date().toISOString() : null;
  });
}