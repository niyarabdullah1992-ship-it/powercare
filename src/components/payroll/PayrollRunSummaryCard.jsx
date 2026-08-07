import React from "react";
import { Landmark, FileDown } from "lucide-react";

// بطاقة مسير الرواتب: إجماليات الشهر + اعتماد المسير وإصدار ملف البنك.
export default function PayrollRunSummaryCard({ monthLabel, currency, totalNet, totalDeductions, employeeCount, paidCount, onApprove, onWps, ar }) {
  const approved = employeeCount > 0 && paidCount === employeeCount;
  const stats = [
    { value: `${totalNet.toLocaleString()} ${currency}`, label: ar ? `مسير رواتب ${monthLabel}` : `${monthLabel} payroll`, big: true },
    { value: employeeCount.toLocaleString(), label: ar ? "عدد الموظفين" : "Employees" },
    { value: `${totalDeductions.toLocaleString()} ${currency}`, label: ar ? "إجمالي الاستقطاعات" : "Total deductions" },
    { value: approved ? (ar ? "معتمد" : "Approved") : (ar ? "بانتظار الاعتماد" : "Awaiting approval"), label: ar ? "الحالة" : "Status" },
  ];

  return (
    <div className="rounded-2xl bg-primary p-5 text-primary-foreground md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0">
              <p className={`truncate font-heading font-semibold ${stat.big ? "text-2xl md:text-3xl" : "text-lg md:text-xl"}`} dir={stat.big ? "ltr" : undefined}>{stat.value}</p>
              <p className="mt-1 text-[11px] text-primary-foreground/65">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onApprove} disabled={approved} className="flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50">
            <Landmark className="h-4 w-4" strokeWidth={1.75} />{ar ? "اعتماد وإرسال للبنك" : "Approve & send to bank"}
          </button>
          <button type="button" onClick={onWps} className="flex items-center gap-2 rounded-md border border-primary-foreground/25 px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10">
            <FileDown className="h-4 w-4" strokeWidth={1.75} />{ar ? "ملف WPS" : "WPS file"}
          </button>
        </div>
      </div>
    </div>
  );
}