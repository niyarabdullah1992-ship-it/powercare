import React, { useRef, useState } from "react";
import { FileSpreadsheet, Download, FileUp, Loader2, Check, X, AlertTriangle } from "lucide-react";
import { downloadPayrollTemplate } from "@/lib/payrollTemplate";
import { extractSalaryRows, matchRowsToEmployees, applySalaryImport } from "@/lib/salaryImport";

// Excel-does-everything flow: download a template pre-filled with all employees,
// edit amounts in Excel, upload it back here — matched rows apply automatically.
export default function PayrollTemplateCard({ company, data, employees, month, ar }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  const steps = ar
    ? ["نزّل القالب — فيه كل موظفيك ورواتبهم الحالية", "عدّل المبالغ في إكسل واحفظ الملف", "ارفع الملف هنا — يُطبَّق كل شيء تلقائيًا"]
    : ["Download the template — pre-filled with all your employees", "Edit the amounts in Excel and save", "Upload the file here — everything applies automatically"];

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setError("");
    setMatches(null);
    setApplied(false);
    try {
      const rows = await extractSalaryRows(file);
      if (!rows.length) {
        setError(ar ? "لم يتم العثور على صفوف رواتب في الملف — تأكد من استخدام القالب." : "No salary rows found in the file — make sure you used the template.");
      } else {
        setMatches(matchRowsToEmployees(rows, employees || []));
      }
    } catch {
      setError(ar ? "تعذّرت قراءة الملف، حاول مجددًا." : "Couldn't read the file, please try again.");
    }
    setBusy(false);
  };

  const apply = () => {
    applySalaryImport(company.id, month, matches);
    setApplied(true);
    setTimeout(() => setMatches(null), 2000);
  };

  const matchedCount = (matches || []).filter((m) => m.employee).length;

  return (
    <div className="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 md:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="font-heading font-semibold text-sm">{ar ? "رواتب عبر الإكسل" : "Payroll via Excel"}</h3>
            <p className="text-[11px] text-muted-foreground font-body">
              {ar ? "الإكسل يقوم بكل شيء: نزّل، عبّئ، ارفع" : "Excel does everything: download, fill, upload"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadPayrollTemplate(data, month, ar, employees)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-emerald-600 text-white text-sm font-body font-medium hover:opacity-90"
          >
            <Download className="w-4 h-4" strokeWidth={1.75} /> {ar ? "تنزيل القالب" : "Download template"}
          </button>
          <input ref={inputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-foreground text-background text-sm font-body font-medium hover:opacity-90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" strokeWidth={1.75} />}
            {busy ? (ar ? "جارِ التحليل..." : "Analyzing...") : (ar ? "رفع الملف" : "Upload file")}
          </button>
        </div>
      </div>

      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground font-body">
            <span className="min-w-[18px] h-[18px] rounded-full bg-emerald-500/15 text-emerald-700 text-[10px] font-semibold flex items-center justify-center mt-px">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      {error && <p className="text-xs text-destructive font-body flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}</p>}

      {matches && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border max-h-64 overflow-y-auto">
            {matches.map(({ row, employee }, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm font-body">
                <div className="min-w-0">
                  <p className="font-medium truncate">{row.name || row.email}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {employee
                      ? (ar ? `سيُطبَّق على: ${employee.name}` : `Will apply to: ${employee.name}`)
                      : (ar ? "لا يوجد موظف مطابق — سيتم تجاهله" : "No matching employee — will be skipped")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono" dir="ltr">
                    {(Number(row.base_salary) || 0).toLocaleString()}{Number(row.allowances) > 0 ? ` +${Number(row.allowances).toLocaleString()}` : ""}{Number(row.deductions) > 0 ? ` −${Number(row.deductions).toLocaleString()}` : ""} {row.currency || ""}
                  </span>
                  {employee
                    ? <Check className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                    : <X className="w-4 h-4 text-destructive" strokeWidth={2} />}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={apply} disabled={matchedCount === 0 || applied} className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-body font-medium hover:opacity-90 disabled:opacity-50">
              <Check className="w-4 h-4" strokeWidth={1.75} />
              {applied
                ? (ar ? "تم التطبيق ✓" : "Applied ✓")
                : (ar ? `تطبيق على ${matchedCount} موظف` : `Apply to ${matchedCount} employees`)}
            </button>
            <button onClick={() => setMatches(null)} className="text-xs text-muted-foreground font-body hover:text-foreground">{ar ? "إلغاء" : "Cancel"}</button>
            <p className="text-[11px] text-muted-foreground font-body">
              {ar ? "يُحدَّث ملف الموظف ومسيّر هذا الشهر (الصفوف المدفوعة لا تُمس)." : "Updates each employee's profile and this month's run (paid rows are untouched)."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}