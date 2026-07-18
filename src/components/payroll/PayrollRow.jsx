import React from "react";
import { FileText, CheckCircle2, Circle } from "lucide-react";
import { netOf } from "@/lib/payroll";

export default function PayrollRow({ item, employee, ar, onChange, onTogglePaid, onPayslip }) {
  const num = (v) => Number(v) || 0;
  const cell = (field, editable = true) => (
    <input
      type="number"
      min="0"
      value={item[field] ?? 0}
      disabled={!editable || item.paid}
      onChange={(e) => onChange(field, Number(e.target.value) || 0)}
      aria-invalid={field === "base" && num(item.base) <= 0}
      title={field === "base" && num(item.base) <= 0 ? (ar ? "الراتب لم يُحدَّد بعد" : "Salary has not been set yet") : undefined}
      className={`h-8 w-24 rounded-md border bg-background px-2 text-end text-sm font-body disabled:opacity-60 ${field === "base" && num(item.base) <= 0 ? "border-destructive/60" : "border-input"}`}
      dir="ltr"
    />
  );
  return (
    <tr className={`align-middle [&>td]:py-2 [&>td]:pe-3 ${item.paid ? "opacity-70" : ""}`}>
      <td data-label={ar ? "الموظف" : "Employee"}>
        <p className="text-sm font-body font-medium">{employee?.name || "—"}</p>
        <p className="text-[11px] text-muted-foreground font-body">{employee?.position || employee?.role || ""}</p>
      </td>
      <td data-label={ar ? "الأساسي" : "Base"}>{cell("base")}</td>
      <td data-label={ar ? "البدلات" : "Allowances"}>{cell("allowances")}</td>
      <td data-label={ar ? "مكافآت" : "Bonus"}>{cell("bonus")}</td>
      <td data-label={ar ? "خصومات" : "Deductions"}>{cell("deductions")}</td>
      <td data-label={ar ? "الصافي" : "Net"}>
        <span className="text-sm font-body font-semibold text-accent" dir="ltr">
          {netOf(item).toLocaleString()} {item.currency}
        </span>
      </td>
      <td data-label={ar ? "الحالة" : "Status"}>
        <button
          onClick={() => onTogglePaid(!item.paid)}
          disabled={!item.paid && num(item.base) <= 0}
          title={!item.paid && num(item.base) <= 0 ? (ar ? "حدّد الراتب الأساسي أولاً" : "Set the base salary first") : undefined}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-medium border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            item.paid
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-muted text-muted-foreground border-border hover:bg-secondary"
          }`}
        >
          {item.paid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
          {item.paid ? (ar ? "مدفوع" : "Paid") : (ar ? "غير مدفوع" : "Unpaid")}
        </button>
      </td>
      <td data-label={ar ? "قسيمة" : "Payslip"}>
        <button
          onClick={onPayslip}
          disabled={num(item.base) + num(item.allowances) === 0}
          title={ar ? "قسيمة الراتب PDF" : "Payslip PDF"}
          className="p-2 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <FileText className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </td>
    </tr>
  );
}