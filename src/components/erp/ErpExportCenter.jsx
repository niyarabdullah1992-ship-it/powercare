import React, { useState } from "react";
import { Users, Banknote, Download } from "lucide-react";
import { ERP_SYSTEMS, buildEmployeesExport, buildPayrollExport, downloadCsv } from "@/lib/erp";
import { getRun, monthKey, ensurePayrollRun } from "@/lib/payroll";

export default function ErpExportCenter({ company, data, ar }) {
  const [system, setSystem] = useState("sap");
  const [month, setMonth] = useState(monthKey());
  const sysName = ERP_SYSTEMS.find((s) => s.id === system)?.name;

  const exportEmployees = () => {
    const { headers, rows } = buildEmployeesExport(data, system);
    downloadCsv(`powercare_employees_${system}.csv`, headers, rows);
  };

  const exportPayroll = () => {
    ensurePayrollRun(company.id, month);
    const run = getRun(data, month) || { items: [] };
    const { headers, rows } = buildPayrollExport(data, run, system);
    downloadCsv(`powercare_payroll_${month}_${system}.csv`, headers, rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {ERP_SYSTEMS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSystem(s.id)}
            className={`px-4 py-2 rounded-full text-sm font-body font-medium border transition-colors ${
              system === s.id ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center"><Users className="w-4 h-4" strokeWidth={1.75} /></span>
            <h3 className="font-heading font-semibold">{ar ? "الموظفون" : "Employees"}</h3>
          </div>
          <p className="text-xs text-muted-foreground font-body">
            {ar ? `ملف CSV بأعمدة قوالب الاستيراد القياسية لـ ${sysName}.` : `CSV file using the standard ${sysName} import template columns.`}
          </p>
          <button onClick={exportEmployees} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-foreground text-background text-sm font-body hover:opacity-90">
            <Download className="w-4 h-4" strokeWidth={1.75} /> {ar ? "تصدير" : "Export"} ({(data.employees || []).length})
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center"><Banknote className="w-4 h-4" strokeWidth={1.75} /></span>
            <h3 className="font-heading font-semibold">{ar ? "مسيّر الرواتب" : "Payroll run"}</h3>
          </div>
          <p className="text-xs text-muted-foreground font-body">
            {ar ? `تصدير رواتب شهر محدد بصيغة ${sysName}.` : `Export a specific month's payroll in ${sysName} format.`}
          </p>
          <div className="flex items-center gap-2">
            <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} dir="ltr" className="px-3 py-2 rounded-md border border-input bg-background text-sm font-body" />
            <button onClick={exportPayroll} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-foreground text-background text-sm font-body hover:opacity-90">
              <Download className="w-4 h-4" strokeWidth={1.75} /> {ar ? "تصدير" : "Export"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}