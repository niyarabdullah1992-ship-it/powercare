import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { Banknote, Download, Users, CheckCircle2, Wallet } from "lucide-react";
import { ensurePayrollRun, getRun, monthKey, netOf, updatePayrollItem, setItemPaid } from "@/lib/payroll";
import { printReport } from "@/lib/printReport";
import PayrollRow from "@/components/payroll/PayrollRow";
import PayrollTemplateCard from "@/components/payroll/PayrollTemplateCard";

export default function Payroll() {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const [month, setMonth] = useState(monthKey());

  const canView = ["director", "ops_manager"].includes(currentUser?.role);

  useEffect(() => {
    if (canView && company) ensurePayrollRun(company.id, month);
  }, [company?.id, month, canView]);

  if (!canView) {
    return <p className="text-sm text-muted-foreground font-body py-10 text-center">{ar ? "هذا القسم متاح للإدارة العليا فقط." : "This section is available to executive management only."}</p>;
  }

  const run = getRun(data, month);
  const items = run?.items || [];
  const empOf = (id) => (data.employees || []).find((e) => e.id === id);
  const visible = items.filter((i) => empOf(i.employeeId));
  const currency = visible[0]?.currency || "SAR";
  const totalNet = visible.reduce((s, i) => s + netOf(i), 0);
  const paidCount = visible.filter((i) => i.paid).length;
  const branding = data.reportBranding || {};
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString(ar ? "ar-SA" : "en-GB", { month: "long", year: "numeric" });

  const headers = ar
    ? ["الموظف", "الأساسي", "البدلات", "مكافآت", "خصومات", "الصافي", "الحالة"]
    : ["Employee", "Base", "Allowances", "Bonus", "Deductions", "Net", "Status"];

  const exportPayroll = () => {
    printReport({
      title: ar ? `مسيّر رواتب — ${monthLabel}` : `Payroll Run — ${monthLabel}`,
      companyName: company.name, periodLabel: monthLabel, dir,
      logoUrl: branding.logoUrl || "", color: branding.color || "#b07d3f",
      stats: [
        { value: visible.length, label: ar ? "الموظفون" : "Employees" },
        { value: `${totalNet.toLocaleString()} ${currency}`, label: ar ? "إجمالي الصافي" : "Total net" },
        { value: `${paidCount}/${visible.length}`, label: ar ? "مدفوع" : "Paid" },
      ],
      sections: [{
        heading: ar ? "تفاصيل الرواتب" : "Salary details",
        headers,
        rows: visible.map((i) => {
          const e = empOf(i.employeeId);
          return [e?.name || "—", i.base, i.allowances, i.bonus, i.deductions, `${netOf(i).toLocaleString()} ${i.currency}`, i.paid ? (ar ? "مدفوع" : "Paid") : (ar ? "غير مدفوع" : "Unpaid")];
        }),
      }],
    });
  };

  const exportPayslip = (item) => {
    const e = empOf(item.employeeId);
    printReport({
      title: ar ? "قسيمة راتب" : "Payslip",
      companyName: company.name, periodLabel: `${e?.name || ""} — ${monthLabel}`, dir,
      logoUrl: branding.logoUrl || "", color: branding.color || "#b07d3f",
      stats: [{ value: `${netOf(item).toLocaleString()} ${item.currency}`, label: ar ? "صافي الراتب" : "Net salary" }],
      sections: [{
        heading: ar ? "تفاصيل الراتب" : "Salary breakdown",
        headers: ar ? ["البند", "المبلغ"] : ["Item", "Amount"],
        rows: [
          [ar ? "الراتب الأساسي" : "Base salary", `${Number(item.base).toLocaleString()} ${item.currency}`],
          [ar ? "البدلات" : "Allowances", `${Number(item.allowances).toLocaleString()} ${item.currency}`],
          [ar ? "المكافآت" : "Bonus", `${Number(item.bonus).toLocaleString()} ${item.currency}`],
          [ar ? "الخصومات" : "Deductions", `- ${Number(item.deductions).toLocaleString()} ${item.currency}`],
          [ar ? "الصافي" : "Net", `${netOf(item).toLocaleString()} ${item.currency}`],
          [ar ? "حالة الدفع" : "Payment status", item.paid ? (ar ? "مدفوع" : "Paid") : (ar ? "غير مدفوع" : "Unpaid")],
        ],
      }],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Banknote className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-semibold">{ar ? "الرواتب" : "Payroll"}</h1>
            <p className="text-xs text-muted-foreground font-body">{ar ? "مسيّر رواتب شهري مبني على ملفات الموظفين" : "Monthly payroll run built from employee salary profiles"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="px-3 py-2 rounded-md border border-input bg-card text-sm font-body"
            dir="ltr"
          />
          <button onClick={exportPayroll} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-foreground text-background text-sm font-body hover:opacity-90">
            <Download className="w-4 h-4" strokeWidth={1.75} /> {ar ? "تصدير PDF" : "Export PDF"}
          </button>
        </div>
      </div>

      <PayrollTemplateCard company={company} data={data} month={month} ar={ar} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          [Users, visible.length, ar ? "الموظفون" : "Employees"],
          [Wallet, `${totalNet.toLocaleString()} ${currency}`, ar ? "إجمالي الصافي" : "Total net"],
          [CheckCircle2, `${paidCount}/${visible.length}`, ar ? "تم الدفع" : "Paid"],
        ].map(([Icon, value, label]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-lg font-semibold truncate" dir="ltr">{value}</p>
              <p className="text-[11px] text-muted-foreground font-body">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 md:p-5 overflow-x-auto">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body py-8 text-center">
            {ar ? "لا يوجد موظفون بعد — أضف موظفين وحدّد رواتبهم من ملفاتهم الشخصية (تبويب الراتب)." : "No employees yet — add employees and set their salaries from their profiles (Salary tab)."}
          </p>
        ) : (
          <table className="w-full mobile-cards">
            <thead>
              <tr className="text-start">
                {[...headers, ar ? "قسيمة" : "Payslip"].map((h) => (
                  <th key={h} className="text-start text-[11px] font-body font-semibold text-muted-foreground pb-3 pe-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((item) => (
                <PayrollRow
                  key={item.id}
                  item={item}
                  employee={empOf(item.employeeId)}
                  ar={ar}
                  onChange={(field, value) => updatePayrollItem(company.id, month, item.id, { [field]: value })}
                  onTogglePaid={(paid) => setItemPaid(company.id, month, item.id, paid)}
                  onPayslip={() => exportPayslip(item)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}