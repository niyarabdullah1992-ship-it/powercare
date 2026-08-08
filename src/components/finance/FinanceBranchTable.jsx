import React from "react";

const fmt = (value, lang) => new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", { maximumFractionDigits: 0 }).format(value || 0);

// توزيع التكلفة على الفروع: رواتب + مصروفات + مشتريات مخزون.
export default function FinanceBranchTable({ rows, lang }) {
  const ar = lang === "ar";
  const totals = rows.reduce((acc, row) => ({
    payroll: acc.payroll + row.payroll,
    expenses: acc.expenses + row.expenses,
    purchases: acc.purchases + row.purchases,
    total: acc.total + row.total,
  }), { payroll: 0, expenses: 0, purchases: 0, total: 0 });

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm mobile-cards">
        <thead>
          <tr>
            <th className="px-4 py-3 text-start font-medium">{ar ? "الفرع" : "Branch"}</th>
            <th className="px-4 py-3 text-start font-medium">{ar ? "الرواتب" : "Payroll"}</th>
            <th className="px-4 py-3 text-start font-medium">{ar ? "المصروفات" : "Expenses"}</th>
            <th className="px-4 py-3 text-start font-medium">{ar ? "المشتريات" : "Purchases"}</th>
            <th className="px-4 py-3 text-start font-medium">{ar ? "الإجمالي" : "Total"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border/60">
              <td data-label={ar ? "الفرع" : "Branch"} className="px-4 py-3 font-medium">{row.name}</td>
              <td data-label={ar ? "الرواتب" : "Payroll"} className="px-4 py-3 text-muted-foreground">{fmt(row.payroll, lang)}</td>
              <td data-label={ar ? "المصروفات" : "Expenses"} className="px-4 py-3 text-muted-foreground">{fmt(row.expenses, lang)}</td>
              <td data-label={ar ? "المشتريات" : "Purchases"} className="px-4 py-3 text-muted-foreground">{fmt(row.purchases, lang)}</td>
              <td data-label={ar ? "الإجمالي" : "Total"} className="px-4 py-3 font-semibold">{fmt(row.total, lang)}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-accent/40 bg-secondary/60">
            <td data-label={ar ? "الفرع" : "Branch"} className="px-4 py-3 font-semibold">{ar ? "الإجمالي العام" : "Grand total"}</td>
            <td className="px-4 py-3 font-semibold">{fmt(totals.payroll, lang)}</td>
            <td className="px-4 py-3 font-semibold">{fmt(totals.expenses, lang)}</td>
            <td className="px-4 py-3 font-semibold">{fmt(totals.purchases, lang)}</td>
            <td className="px-4 py-3 font-semibold text-accent-text">{fmt(totals.total, lang)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}