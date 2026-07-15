import React, { useRef, useState } from "react";
import { FileUp, Loader2, Sparkles, Check, X, AlertTriangle } from "lucide-react";
import { extractSalaryRows, matchRowsToEmployees, applySalaryImport } from "@/lib/salaryImport";

// Smart PDF/Excel salary import: upload → AI extraction → per-employee match
// preview → one-click apply to salary profiles + this month's payroll run.
export default function SalaryImportCard({ company, data, month, ar }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setError("");
    setMatches(null);
    setApplied(false);
    try {
      const rows = await extractSalaryRows(file);
      if (!rows.length) {
        setError(ar ? "لم يتم العثور على صفوف رواتب في الملف — تأكد أن الملف يحتوي أسماء ومبالغ واضحة." : "No salary rows found in the file — make sure it contains clear names and amounts.");
      } else {
        setMatches(matchRowsToEmployees(rows, data.employees || []));
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
    <div className="rounded-xl border border-dashed border-accent/40 bg-accent/5 p-4 md:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center"><Sparkles className="w-4 h-4" strokeWidth={1.75} /></span>
          <div>
            <h3 className="font-heading font-semibold text-sm">{ar ? "استيراد الرواتب الذكي" : "Smart salary import"}</h3>
            <p className="text-[11px] text-muted-foreground font-body">
              {ar ? "ارفع ملف الرواتب (PDF / Excel / CSV / صورة) وسيوزَّع تلقائيًا على الموظفين" : "Upload a salary file (PDF / Excel / CSV / image) and it's applied to employees automatically"}
            </p>
          </div>
        </div>
        <input ref={inputRef} type="file" accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
        <button onClick={() => inputRef.current?.click()} disabled={busy} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-accent text-accent-foreground text-sm font-body font-medium hover:opacity-90 disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" strokeWidth={1.75} />}
          {busy ? (ar ? "جارِ التحليل..." : "Analyzing...") : (ar ? "رفع ملف" : "Upload file")}
        </button>
      </div>

      {error && <p className="text-xs text-destructive font-body flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}</p>}

      {matches && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border max-h-64 overflow-y-auto">
            {matches.map(({ row, employee }, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm font-body">
                <div className="min-w-0">
                  <p className="font-medium truncate">{row.name}</p>
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
          <div className="flex items-center gap-3">
            <button onClick={apply} disabled={matchedCount === 0 || applied} className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body font-medium hover:opacity-90 disabled:opacity-50">
              {applied ? <Check className="w-4 h-4 text-emerald-400" /> : <Check className="w-4 h-4" strokeWidth={1.75} />}
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