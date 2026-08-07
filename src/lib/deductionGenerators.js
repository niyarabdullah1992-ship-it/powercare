// Generates documented payroll deduction lines from approved records — instead of
// re-typing amounts manually in payroll.
// Idempotent: the same sourceRefId never produces a line twice.
import { addDeductionLine, deductionLines } from "@/lib/payrollDeductions";
import { getRun, ensurePayrollRun, monthKey } from "@/lib/payroll";
import { getCompanyData } from "@/lib/store";

export function generateAbsenceDeduction(companyId, employeeId, attendanceRecordId, days, actor) {
  const month = monthKey();
  ensurePayrollRun(companyId, month);
  const data = getCompanyData(companyId);
  const run = getRun(data, month);
  const item = run?.items.find((i) => i.employeeId === employeeId);
  if (!item || item.paid) return "NO_OPEN_ITEM";
  const refId = `ATT-${attendanceRecordId}`;
  if (deductionLines(item).some((l) => l.sourceRefId === refId)) return "ALREADY_GENERATED";
  const daily = (Number(item.base) || 0) / 30;
  return addDeductionLine(companyId, month, item, {
    amount: Math.round(daily * days * 100) / 100,
    source: "attendance",
    sourceRefId: refId,
    reason: `غياب معتمد ${days} يوم · Approved unpaid absence (${days} day${days === 1 ? "" : "s"})`,
  }, actor);
}